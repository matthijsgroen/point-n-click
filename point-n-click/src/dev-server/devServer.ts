import { createWorkerFarm, Parcel } from "@parcel/core";
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

  try {
    let { bundleGraph } = await bundler.run();
    for (let bundle of bundleGraph.getBundles()) {
      const gameContentsDSL = await outputFS.readFile(bundle.filePath, "utf-8");
      const absPath = path.resolve(`./${CACHE_FOLDER}/contents.js`);
      await writeFile(absPath, gameContentsDSL, "utf-8");

      const gameModel = await import(absPath);
      jsonModel = gameModel.default.default.__exportWorld();
      const absContentPath = path.resolve(`./${CACHE_FOLDER}/contents.json`);
      await writeFile(absContentPath, JSON.stringify(jsonModel), "utf-8");
    }
  } catch (err) {
    console.log(err.diagnostics);
  } finally {
    await workerFarm.end();
  }

  const translationData = await loadTranslationData(options.lang);

  if (jsonModel) {
    const modelManager = gameModelManager(jsonModel);

    // run CLI
    runGame({ color: true, translationData }, modelManager);
  }
};
