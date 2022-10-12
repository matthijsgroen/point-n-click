import Parcel, { createWorkerFarm } from "@parcel/core";
import { MemoryFS } from "@parcel/fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { GameWorld } from "../dsl/world-types";
import { GameModelManager } from "../engine/model/gameModel";
import { CACHE_FOLDER } from "./constants";
import { mkdir } from "./mkdir";

export const startWebServer = async <Game extends GameWorld>(
  modelManager: GameModelManager<Game>
) => {
  const serveFolder = join(CACHE_FOLDER, "web-client");
  await mkdir(serveFolder);

  const fileContents = `
  <!DOCTYPE html><html><head><title>Point 'n Click</title></head><body>
        <h1>Profit!</h1>
        <p>$$$$$</p>
        <script type="module" src="./index.ts" />
  </body></html>
  `;

  const entryPath = join(serveFolder, "index.html");
  await writeFile(entryPath, fileContents, "utf-8");

  const webContents = 'import "point-n-click/dist/web/contents.js";';

  await writeFile(join(serveFolder, "index.ts"), webContents, "utf-8");

  let workerFarm = createWorkerFarm();
  let outputFS = new MemoryFS(workerFarm);
  let contentBundler = new Parcel({
    entries: entryPath,
    defaultConfig: "@parcel/config-default",
    workerFarm,
    outputFS,
    serveOptions: {
      port: 4554,
    },
    shouldAutoInstall: true,
  });
  let subscription = await contentBundler.watch(async (err, event) => {
    if (err) {
      // fatal error
      throw err;
    }

    if (event && event.type === "buildSuccess") {
    } else if (event && event.type === "buildFailure") {
    }
  });
  return async () => {
    await subscription.unsubscribe();
  };
};
