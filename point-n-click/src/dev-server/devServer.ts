import { createWorkerFarm, Parcel } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import { readFile, unlink, writeFile } from "fs/promises";
import path, { join } from "path";
import { runGame } from "../cli-client/run";
import { bold, cls, resetStyling } from "../cli-client/utils";
import { GameModel } from "../dsl/ast-types";
import { GameWorld } from "../dsl/world-types";
import { gameModelManager } from "../engine/model/gameModel";
import { TranslationFile } from "../export-translations/exportTranslations";
import { mkdir } from "./mkdir";
import sourceMap from "source-map";

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
        modelManager.setNewModel(jsonModel);
      } catch (e) {
        cls();
        if (e instanceof TypeError) {
          const gameContentsSourceMap = await outputFS.readFile(
            `${bundle.filePath}.map`,
            "utf-8"
          );
          const mapping = new sourceMap.SourceMapConsumer(
            gameContentsSourceMap
          );
          const [line, column] = e.stack
            .split("\n")[1]
            .split(":")
            .slice(-2)
            .map((num: string) => parseInt(num, 10));

          const result = (await mapping).originalPositionFor({ line, column });
          console.log(e.message);

          console.log(
            `  at ${process.cwd()}${result.source}:${result.line}:${
              result.column
            }`
          );
          console.log("");
          if (result.source && result.line) {
            const line = result.line;
            const originalContents =
              (await mapping).sourceContentFor(result.source)?.split("\n") ??
              [];

            const errorLines = originalContents.slice(line - 3, line + 2);

            errorLines.forEach((l, index) => {
              if (index === 2) {
                bold();
              }
              console.log(`${line - 2 + index} ${index == 2 ? ">" : " "} ${l}`);
              resetStyling();
            });
          }
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
  process.exit(0);
};
