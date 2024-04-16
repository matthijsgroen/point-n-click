import { GameModelManager, getTranslationText } from "@point-n-click/engine";
import {
  GameModel,
  GameSaveStateManager,
  GameWorld,
} from "@point-n-click/types";
import express from "express";
import { dirname, join, relative } from "node:path";
import bodyParser from "body-parser";
import { produce } from "immer";
import { CACHE_FOLDER } from "./constants";
import { mkdir } from "../content-builder/mkdir";
import { writeFile } from "node:fs/promises";
import Parcel, { createWorkerFarm } from "@parcel/core";
import { PackagedBundle } from "@parcel/types";
import { htmlFile, indexFile } from "./templates/game";
import {
  htmlFile as diagramHtmlFile,
  scriptFile as diagramScriptFile,
} from "./templates/diagram";
import {
  htmlFile as mapHtmlFile,
  scriptFile as mapScriptFile,
} from "./templates/map";
import { watch } from "fs";

const defaultWatchList = [
  "@point-n-click/engine",
  "@point-n-click/web-engine",
  "@point-n-click/puzzle-dependency-diagram",
];

type HTMLSettings = {
  title: string;
  lang: string;
  scriptPath: string;
};
type EntryPoint = {
  entryName: string;
  htmlProducer: (templateSettings: HTMLSettings) => string;
  scriptProducer: () => string;
};

const supportEntryPoints: EntryPoint[] = [
  {
    entryName: "diagram",
    htmlProducer: diagramHtmlFile,
    scriptProducer: diagramScriptFile,
  },
  {
    entryName: "map",
    htmlProducer: mapHtmlFile,
    scriptProducer: mapScriptFile,
  },
];

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  stateManager: GameSaveStateManager<GameWorld>,
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
  const devServerOutputPath = join(CACHE_FOLDER, "dev-dist");
  await mkdir(devServerPath);
  await mkdir(devServerOutputPath);

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

  const gameEntryFile = join(devServerPath, "index.html");

  const extraEntries = supportEntryPoints.map((settings) =>
    join(devServerPath, `${settings.entryName}.html`)
  );

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
      gameEntryFile,
      htmlFile({
        title: getTranslationText([], "title") ?? model.settings.gameTitle,
        lang: lang ?? model.settings.locales.default,
      }),
      { encoding: "utf8" }
    );

    await Promise.all([configPromise, indexPromise, entryPromise]);
  };

  const buildEntry = async (
    settings: EntryPoint,
    model: GameModel<GameWorld>
  ) => {
    const scriptFile = `${settings.entryName}.tsx`;
    const scriptPromise = writeFile(
      join(devServerPath, scriptFile),
      settings.scriptProducer(),
      { encoding: "utf8" }
    );

    const entryPromise = writeFile(
      join(devServerPath, `${settings.entryName}.html`),
      settings.htmlProducer({
        title: getTranslationText([], "title") ?? model.settings.gameTitle,
        lang: lang ?? model.settings.locales.default,
        scriptPath: scriptFile,
      }),
      { encoding: "utf8" }
    );

    await Promise.all([configPromise, scriptPromise, entryPromise]);
  };

  const webappBundler = new Parcel({
    entries: [gameEntryFile, ...extraEntries],
    defaultConfig: configFile,
    // workerFarm,
    // outputFS,
    mode: "production",
    env: {
      NODE_ENV: "production",
    },

    shouldAutoInstall: false,
    targets: {
      main: {
        distDir: devServerOutputPath,
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
  for (const settings of supportEntryPoints) {
    await buildEntry(settings, model);
  }

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

  const rebuildOnModelOrEngineChange = (): [VoidFunction, Promise<void>] => {
    let keepLoop = true;

    const stopLoop = () => {
      keepLoop = false;
    };

    let resolve: VoidFunction;
    const initialBuildPromise = new Promise<void>((resolver) => {
      resolve = resolver;
    });

    const run = async () => {
      while (keepLoop) {
        const newModel = modelManager.getModel();
        if (newModel && keepLoop) {
          updateWatch(newModel);
          // const start = new Date().getTime();
          await buildWebFiles(newModel);
          for (const settings of supportEntryPoints) {
            await buildEntry(settings, newModel);
          }
          await bundleEngine();
          // const end = new Date().getTime();
          // console.log(
          //   `🎉 rebuild web client in ${Math.ceil((end - start) / 100) / 10}s`
          // );
          resolve();
        }
        if (!keepLoop) return;
        await Promise.race([modelManager.waitForChange(), watchPromise]);
      }
    };
    run();
    return [stopLoop, initialBuildPromise];
  };

  const [stopRebuild, initialBuildPromise] = rebuildOnModelOrEngineChange();

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
    res.json(stateManager.stableState().get());
  });

  app.post("/development-server/action", function (req, res) {
    const actionId = req.body.action;
    stateManager.activeState().update(
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
  app.use("/", express.static(devServerOutputPath));

  const server = app.listen(port, () => {
    serverStartResolver();
  });

  await startupPromise;
  await initialBuildPromise;

  return [
    async () => {
      watchAbort?.abort();
      // await workerFarm.end();
      server.close();
      stopRebuild();
    },
    port,
  ];
};
