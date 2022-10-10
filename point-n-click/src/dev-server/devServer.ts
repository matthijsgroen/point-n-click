import { createWorkerFarm, Parcel } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import { readFile, unlink, writeFile } from "fs/promises";
import path, { join } from "path";
import { runGame } from "../cli-client/run";
import { cls } from "../cli-client/utils";
import { GameModel } from "../dsl/ast-types";
import { GameWorld } from "../dsl/world-types";
import { GameModelManager, gameModelManager } from "../engine/model/gameModel";
import {
  exportTranslations,
  isLocale,
  Locale,
  TranslationFile,
} from "../export-translations/exportTranslations";
import { mkdir } from "./mkdir";
import { displayTypescriptError } from "../engine/errors/displayErrors";
import { updateSettings } from "../cli-client/settings";
import { fstat, watch } from "fs";

const CACHE_FOLDER = ".point-n-cache";

type ServerOptions = {
  lang: string;
};

const loadTranslationData = async (
  locale?: string
): Promise<TranslationFile | undefined> => {
  const runRoot = process.cwd();

  let translationData: TranslationFile | undefined = undefined;
  if (locale) {
    try {
      const translationFilePath = join(
        runRoot,
        "src",
        "translations",
        `${locale}.json`
      );
      const data = await readFile(translationFilePath, { encoding: "utf-8" });
      translationData = JSON.parse(data) as unknown as TranslationFile;

      updateSettings({ translationData });
    } catch (e) {}
  }
  return translationData;
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

export const devServer = async (fileName: string, options: ServerOptions) => {
  await mkdir(CACHE_FOLDER);

  let workerFarm = createWorkerFarm();
  let outputFS = new MemoryFS(workerFarm);
  let bundler = new Parcel({
    entries: fileName,
    defaultConfig: "@parcel/config-default",

    workerFarm,
    outputFS,
  });

  let jsonModel: GameModel<GameWorld> | undefined = undefined;
  let modelManager = gameModelManager(undefined);

  let watchingTranslation: undefined | string = undefined;
  let translationWatchController: undefined | AbortController = undefined;

  let subscription = await bundler.watch(async (err, event) => {
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
        cls();
        if (e instanceof TypeError) {
          const gameContentsSourceMap = await outputFS.readFile(
            `${bundle.filePath}.map`,
            "utf-8"
          );
          displayTypescriptError(gameContentsSourceMap, e);
        }
        modelManager.setNewModel(undefined);
      }
    } else if (event && event.type === "buildFailure") {
      cls();
      console.log(event.diagnostics);
      modelManager.setNewModel(undefined);
    }
  });

  const translationData = await loadTranslationData(options.lang);

  await runGame({ color: true, translationData }, modelManager);
  await subscription.unsubscribe();
  if (translationWatchController) {
    (translationWatchController as AbortController).abort();
  }
  process.exit(0);
};
