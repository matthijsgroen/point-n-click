import { GameModel, GameWorld } from "@point-n-click/types";
import { CACHE_FOLDER } from "../dev-server/constants";
import { unlink, writeFile } from "fs/promises";
import { resolve } from "path";

export const convertToGameModel = async (
  fileContents: string
): Promise<GameModel<GameWorld>> => {
  const absPath = resolve(
    `./${CACHE_FOLDER}/contents-${new Date().getTime()}.js`
  );
  await writeFile(absPath, fileContents, "utf-8");

  try {
    const gameModel = await import(absPath);
    const jsonModel: GameModel<GameWorld> =
      gameModel.default.default.__exportWorld();

    const absContentPath = resolve(`./${CACHE_FOLDER}/contents.json`);
    await writeFile(absContentPath, JSON.stringify(jsonModel), "utf-8");

    return jsonModel;
  } finally {
    await unlink(absPath);
  }
};
