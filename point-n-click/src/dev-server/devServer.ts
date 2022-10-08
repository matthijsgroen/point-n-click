import { createWorkerFarm, Parcel } from "@parcel/core";
import { PackagedBundle } from "@parcel/types";
import { MemoryFS } from "@parcel/fs";
import { readFile, writeFile } from "fs/promises";
import path, { join } from "path";
import { runGame } from "../cli-client/run";
import { GameModel } from "../dsl/ast-types";
import { GameWorld } from "../dsl/world-types";
import { gameModelManager } from "../engine/model/gameModel";
import { TranslationFile } from "../export-translations/exportTranslations";
import { mkdir } from "./mkdir";

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
    } catch (e) {}
  }
  return translationData;
};

const convertToGameModel = async (
  fileContents: string
): Promise<GameModel<GameWorld>> => {
  const absPath = path.resolve(`./${CACHE_FOLDER}/contents.js`);
  await writeFile(absPath, fileContents, "utf-8");

  const gameModel = await import(absPath);
  const jsonModel: GameModel<GameWorld> =
    gameModel.default.default.__exportWorld();
  const absContentPath = path.resolve(`./${CACHE_FOLDER}/contents.json`);
  await writeFile(absContentPath, JSON.stringify(jsonModel), "utf-8");
  return jsonModel;
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

  let subscription = await bundler.watch(async (err, event) => {
    if (err) {
      // fatal error
      throw err;
    }

    if (event && event.type === "buildSuccess") {
      let bundle = event.bundleGraph.getBundles()[0];
      const gameContentsDSL = await outputFS.readFile(bundle.filePath, "utf-8");
      jsonModel = await convertToGameModel(gameContentsDSL);
      modelManager.setNewModel(jsonModel);
    } else if (event && event.type === "buildFailure") {
      console.log(event.diagnostics);
      modelManager.setNewModel(undefined);
    }
  });

  await runGame({ color: true }, modelManager);
  await subscription.unsubscribe();
  process.exit(0);
};
