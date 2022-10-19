/// <reference types="node" />
import Parcel, { createWorkerFarm } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import { GameModel } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { watch } from "fs";
import { unlink, writeFile } from "fs/promises";
import path, { join } from "path";
import { GameModelManager } from "../engine/model/gameModel";
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
};

const watchTranslations = <Game extends GameWorld>(
  locale: Locale,
  gameModelManager: GameModelManager<Game>
): AbortController => {
  const ac = new AbortController();
  const { signal } = ac;

  const fileName = join(process.cwd(), "src", "translations", `${locale}.json`);
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
  options: ServerOptions,
  modelManager: GameModelManager<GameWorld>
) => {
  let jsonModel: GameModel<GameWorld> | undefined = undefined;
  let translationWatchController: undefined | AbortController = undefined;

  await mkdir(CACHE_FOLDER);
  let workerFarm = createWorkerFarm();
  let outputFS = new MemoryFS(workerFarm);
  let contentBundler = new Parcel({
    entries: fileName,
    defaultConfig: "@parcel/config-default",
    workerFarm,
    outputFS,
  });
  let watchingTranslation: undefined | string = undefined;

  let subscription = await contentBundler.watch(async (err, event) => {
    if (err) {
      // fatal error
      throw err;
    }

    if (event && event.type === "buildSuccess") {
      let bundle = event.bundleGraph.getBundles()[0];
      const gameContentsDSL = await outputFS.readFile(bundle.filePath, "utf-8");
      try {
        jsonModel = await convertToGameModel(gameContentsDSL);

        const defaultLocale = jsonModel.settings.defaultLocale;
        if (isLocale(options.lang) && options.lang !== defaultLocale) {
          await exportTranslations(
            join(process.cwd(), "src", "translations"),
            [options.lang],
            jsonModel
          );

          if (!watchingTranslation) {
            translationWatchController = watchTranslations(
              options.lang,
              modelManager
            );
            watchingTranslation = options.lang;
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
    if (translationWatchController) {
      (translationWatchController as AbortController).abort();
    }
  };
};
