import { GameModelManager } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import express from "express";
import { join, relative } from "node:path";
import { GameStateManager } from "@point-n-click/state";
import bodyParser from "body-parser";
import produce from "immer";
import { CACHE_FOLDER } from "./constants";
import { mkdir } from "./mkdir";
import { writeFile } from "node:fs/promises";
import Parcel, { createWorkerFarm } from "@parcel/core";
import { PackagedBundle } from "@parcel/types";
import { MemoryFS } from "@parcel/fs";
import mime from "mime/lite";

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  stateManager: GameStateManager<GameWorld>,
  resolves: Record<string, string>,
  { port = 3456, lang }: { port?: number; lang?: string } = {}
) => {
  const devServerPath = join(CACHE_FOLDER, "dev-build");
  await mkdir(devServerPath);

  let workerFarm = createWorkerFarm();
  let outputFS = new MemoryFS(workerFarm);

  const configFile = join(devServerPath, ".parcelrc");
  const configPromise = writeFile(
    configFile,
    JSON.stringify(
      {
        extends: `${relative(
          devServerPath,
          resolves["@parcel/config-default"]
        )}`,
        resolvers: ["@point-n-click/parcel-resolver", "..."],
      },
      undefined,
      2
    ),
    {
      encoding: "utf8",
    }
  );

  const indexPromise = writeFile(
    join(devServerPath, "index.tsx"),
    `
import React, {useState} from "react";
import { createRoot } from "react-dom/client";
import { App, registerTheme } from "@point-n-click/web-engine";
import terminalTheme from "@point-n-click/theme-cli";

registerTheme("terminal", terminalTheme, { color: true });
registerTheme("terminalBW", terminalTheme, { color: false });

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  `,
    { encoding: "utf8" }
  );

  const entryFile = join(devServerPath, "index.html");

  const entryPromise = writeFile(
    entryFile,
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Game created using Point-n-click" />
    <title>Point 'n Click development server</title>
  </head>
  <body data-environment="development">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="./index.tsx" />
  </body>
</html>`,
    { encoding: "utf8" }
  );

  await Promise.all([configPromise, indexPromise, entryPromise]);

  let webappBundler = new Parcel({
    entries: entryFile,
    defaultConfig: configFile,
    workerFarm,
    outputFS,
    mode: "production",
    env: {
      NODE_ENV: "production",
    },

    shouldAutoInstall: false,
    shouldDisableCache: true,
    targets: {
      main: {
        distDir: "./",
        publicUrl: "/",
        context: "browser",
        sourceMap: true,
      },
    },
    defaultTargetOptions: {
      shouldOptimize: true,
    },
  });

  const { bundleGraph } = await webappBundler.run();
  const bundles = bundleGraph.getBundles();
  const bundleMap: Record<string, PackagedBundle> = {};
  for (const bundle of bundles) {
    const path = relative(process.cwd(), bundle.filePath);
    bundleMap[`/${path}`] = bundle;
  }

  const app = express();

  const jsonParser = bodyParser.json();
  app.use(jsonParser);
  let serverStartResolver: () => void = () => {};
  const startupPromise = new Promise<void>((resolve) => {
    serverStartResolver = resolve;
  });

  app.get("/assets/contents.json", function (_req, res) {
    res.json(modelManager.getBackupModel());
  });

  app.get("/development-server/save.json", function (_req, res) {
    res.json(stateManager.getSaveState());
  });

  app.post("/development-server/action", function (req, res) {
    const actionId = req.body.action;
    stateManager.updateState(
      produce((state) => {
        state.currentInteraction = actionId;
      })
    );
    stateManager.updateSaveState();
    modelManager.restoreModel();

    res.json({ status: "ok" });
  });

  const translationFilePath = join(process.cwd(), "src", "translations");
  app.use("/assets/lang/", express.static(translationFilePath));

  const getBundle = (path: string): PackagedBundle | undefined => {
    const bundlePath = path === "/" ? "/index.html" : path;
    return bundleMap[bundlePath];
  };

  app.use((req, res, next) => {
    const bundle = getBundle(req.path);
    if (bundle) {
      const filePath = bundle.filePath;
      const stats = outputFS.statSync(filePath);
      const mimeType = mime.getType(filePath);
      res.set({
        "Content-type": mimeType,
        "Content-length": stats.size,
      });
      outputFS.createReadStream(filePath).pipe(res);
      return;
    }

    next();
  });

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    serverStartResolver();
  });

  await startupPromise;

  return async () => {
    await workerFarm.end();
    server.close();
  };
};
