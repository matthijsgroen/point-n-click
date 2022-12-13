import { GameModelManager, getTranslationText } from "@point-n-click/engine";
import { GameStateManager, GameWorld } from "@point-n-click/types";
import express from "express";
import { dirname, join, relative } from "node:path";
import bodyParser from "body-parser";
import produce from "immer";
import { CACHE_FOLDER } from "./constants";
import { mkdir } from "./mkdir";
import { writeFile } from "node:fs/promises";
import Parcel, { createWorkerFarm } from "@parcel/core";
import { PackagedBundle } from "@parcel/types";
import { MemoryFS } from "@parcel/fs";
import mime from "mime/lite";
import { htmlFile } from "./templates/htmlFile";
import { indexFile } from "./templates/indexFile";
import { GameModel } from "@point-n-click/state";
import { watch } from "fs";

const defaultWatchList = ["@point-n-click/engine", "@point-n-click/web-engine"];

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  stateManager: GameStateManager<GameWorld>,
  {
    port = 3456,
    lang,
    resolver,
  }: {
    port?: number;
    lang?: string;
    resolver: (packageName: string) => string;
  }
): Promise<[stopServer: () => Promise<void>, runningPort: number]> => {
  const devServerPath = join(CACHE_FOLDER, "dev-build");
  await mkdir(devServerPath);

  const workerFarm = createWorkerFarm();
  const outputFS = new MemoryFS(workerFarm);

  let model = modelManager.getModel();
  while (!modelManager.hasModel()) {
    await modelManager.waitForChange();
    model = modelManager.getModel();
  }

  const bundleMap: Record<string, PackagedBundle> = {};

  const configFile = join(devServerPath, ".parcelrc");
  const configPromise = writeFile(
    configFile,
    JSON.stringify(
      {
        extends: `${relative(
          devServerPath,
          resolver("@parcel/config-default")
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

  const entryFile = join(devServerPath, "index.html");

  const buildWebFiles = async (model: GameModel<GameWorld>) => {
    const indexPromise = writeFile(
      join(devServerPath, "index.tsx"),
      indexFile({
        lang: lang ?? model.settings.locales.default,
        themes: model.themes ?? [
          {
            name: "Default",
            themePackage: "@point-n-click/theme-cli",
            settings: { color: true },
          },
        ],
      }),
      { encoding: "utf8" }
    );

    const entryPromise = writeFile(
      entryFile,
      htmlFile({
        title: getTranslationText([], "title") ?? model.settings.gameTitle,
        lang: lang ?? model.settings.locales.default,
      }),
      { encoding: "utf8" }
    );

    await Promise.all([configPromise, indexPromise, entryPromise]);
  };

  const webappBundler = new Parcel({
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

  const bundleEngine = async () => {
    const { bundleGraph } = await webappBundler.run();
    const bundles = bundleGraph.getBundles();
    for (const bundle of bundles) {
      const path = relative(process.cwd(), bundle.filePath);
      bundleMap[`/${path}`] = bundle;
    }
  };

  await buildWebFiles(model);

  let watchAbort: AbortController = new AbortController();
  let watchPromise: Promise<void> = new Promise(() => {});

  const updateWatch = (model: GameModel<GameWorld>) => {
    if (watchAbort) {
      watchAbort.abort();
    }
    const watchList = defaultWatchList
      .map((packageName) => resolver(packageName))
      .concat(
        model.themes
          .filter(
            (t, i, l) =>
              !l
                .slice(0, i)
                .find((prevTheme) => prevTheme.themePackage === t.themePackage)
          )
          .map((t) => resolver(t.themePackage))
      );

    watchAbort = new AbortController();
    watchPromise = new Promise((resolve) => {
      const { signal } = watchAbort;
      for (const file of watchList) {
        const folder = dirname(file);
        watch(folder, { signal, recursive: true }, async () => {
          resolve();
          watchAbort.abort();
        });
      }
    });
  };

  const rebuildOnModelOrEngineChange = () => {
    let keepLoop = true;

    const stopLoop = () => {
      keepLoop = false;
    };

    const run = async () => {
      while (keepLoop) {
        const newModel = modelManager.getModel();
        if (newModel && keepLoop) {
          updateWatch(newModel);
          await buildWebFiles(newModel);
          await bundleEngine();
        }
        if (!keepLoop) return;
        await Promise.race([modelManager.waitForChange(), watchPromise]);
      }
    };
    run();
    return stopLoop;
  };

  const stopRebuild = rebuildOnModelOrEngineChange();

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
    serverStartResolver();
  });

  await startupPromise;

  return [
    async () => {
      watchAbort?.abort();
      await workerFarm.end();
      server.close();
      stopRebuild();
    },
    port,
  ];
};
