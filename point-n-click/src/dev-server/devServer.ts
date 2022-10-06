import { createWorkerFarm, Parcel } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import { writeFile } from "fs/promises";
import path from "path";
import { runGame } from "../cli-client/run";
import { GameModel } from "../dsl/ast-types";
import { GameWorld } from "../dsl/world-types";
import { mkdir } from "./mkdir";

const CACHE_FOLDER = ".point-n-cache";

export const devServer = async (fileName: string) => {
  console.log("dev command called", fileName);

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

  // run CLI
  runGame({ color: true })(jsonModel);
};
