/// <reference types="node" />
import Parcel, { createWorkerFarm } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import {
  clearRegisteredThemes,
  GameModelManager,
  registerTheme,
} from "@point-n-click/engine";
import { GameModel } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { watch } from "fs";
import { unlink, writeFile } from "fs/promises";
import path from "path";
import {
  isLocale,
  exportTranslations,
  Locale,
} from "../export-translations/exportTranslations";
import { CACHE_FOLDER } from "./constants";
import { displayTypescriptError } from "./displayTypescriptError";
import { loadTranslationData } from "./loadTranslationData";
import { mkdir } from "./mkdir";

type ServerOptions = {
  lang: string;
  resolver: (packageName: string) => string;
};

const watchTranslations = <Game extends GameWorld>(
  locale: Locale,
  gameModelManager: GameModelManager<Game>
): AbortController => {
  const ac = new AbortController();
  const { signal } = ac;

  const fileName = path.join(
    process.cwd(),
    "src",
    "translations",
    `${locale}.json`
  );
  watch(fileName, { signal }, async () => {
    await loadTranslationData(locale);
    gameModelManager.restoreModel();
  });

  return ac;
};

const convertToGameModel = async (
  fileContents: string
): Promise<GameModel<GameWorld>> => {
  const absPath = path.resolve(
    `./${CACHE_FOLDER}/contents-${new Date().getTime()}.js`
  );
  await writeFile(absPath, fileContents, "utf-8");

  try {
    const gameModel = await import(absPath);
    const jsonModel: GameModel<GameWorld> =
      gameModel.default.default.__exportWorld();

    const absContentPath = path.resolve(`./${CACHE_FOLDER}/contents.json`);
    await writeFile(absContentPath, JSON.stringify(jsonModel), "utf-8");

    return jsonModel;
  } finally {
    await unlink(absPath);
  }
};

export const startContentBuilder = async (
  fileName: string,
  { resolver, lang }: ServerOptions,
  modelManager: GameModelManager<GameWorld>
) => {
  let jsonModel: GameModel<GameWorld> | undefined = undefined;
  let translationWatchController: undefined | AbortController = undefined;

  await mkdir(CACHE_FOLDER);
  let workerFarm = createWorkerFarm();
  let outputFS = new MemoryFS(workerFarm);
  let contentBundler = new Parcel({
    entries: fileName,
    defaultConfig: resolver("@parcel/config-default"),
    shouldAutoInstall: false,

    workerFarm,
    outputFS,
    defaultTargetOptions: {
      isLibrary: true,
      engines: { node: "*" },
    },
  });
  let watchingTranslation: undefined | string = undefined;

  let subscription = await contentBundler.watch(async (err, event) => {
    if (err) {
      console.log("Fatal error in build");
      // fatal error
      throw err;
    }

    if (event && event.type === "buildSuccess") {
      const bundles = event.bundleGraph.getBundles();
      let bundle = bundles[0];
      const gameContentsDSL = await outputFS.readFile(bundle.filePath, "utf-8");
      try {
        jsonModel = await convertToGameModel(gameContentsDSL);
        if (jsonModel.themes) {
          for (const themeRegistration of jsonModel.themes) {
            clearRegisteredThemes();

            await import(themeRegistration.themePackage).then(
              (themeDefinition) => {
                registerTheme(
                  themeDefinition.default.default(
                    themeRegistration.name,
                    themeRegistration.settings
                  )
                );
              }
            );
          }
        }

        const defaultLocale = jsonModel.settings.defaultLocale;
        if (isLocale(lang) && lang !== defaultLocale) {
          await exportTranslations(
            path.join(process.cwd(), "src", "translations"),
            [lang],
            jsonModel
          );

          if (!watchingTranslation) {
            translationWatchController = watchTranslations(lang, modelManager);
            watchingTranslation = lang;
          }
        }

        modelManager.setNewModel(jsonModel);
      } catch (e) {
        if (e instanceof TypeError) {
          const gameContentsSourceMap = await outputFS.readFile(
            `${bundle.filePath}.map`,
            "utf-8"
          );
          displayTypescriptError(gameContentsSourceMap, e);
          modelManager.setNewModel(undefined);
        } else {
          console.log("Fatal error in import");
          throw e;
        }
      }
    } else if (event && event.type === "buildFailure") {
      console.log(event.diagnostics);
      modelManager.setNewModel(undefined);
    }
  });
  return async () => {
    await subscription.unsubscribe();
    await workerFarm.end();
    if (translationWatchController) {
      (translationWatchController as AbortController).abort();
    }
  };
};
