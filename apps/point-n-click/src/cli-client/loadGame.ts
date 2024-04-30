import { mergeState } from "@point-n-click/state";
import { GameSaveStateManager, GameWorld } from "@point-n-click/types";
import { readFile, readdir } from "fs/promises";
import { basename, join } from "path";
import { Save } from "./saveGame";

export const readSaveGame = async <Game extends GameWorld>(
  filename: string
): Promise<Save<Game>> => {
  const saveFilePath = join(process.cwd(), "saves", `${filename}.json`);
  const saveFile = await readFile(saveFilePath, { encoding: "utf-8" });
  return JSON.parse(saveFile) as Save<Game>;
};

export const loadGame = async <Game extends GameWorld>(
  filename: string,
  gameStateManager: GameSaveStateManager<Game>
) => {
  // TODO: Game state migrations...
  try {
    const contents = (await readSaveGame<Game>(filename)).content;
    gameStateManager
      .activeState()
      .update((state) => mergeState(state, contents));
    gameStateManager.updateSaveState();
  } catch (e) {}
};

export const getSaveGames = async <Game extends GameWorld>(): Promise<
  Record<string, Save<Game>>
> => {
  const result: Record<string, Save<Game>> = {};
  const path = join(process.cwd(), "saves");

  const files = await readdir(path);
  for (const filename of files.filter((file) => /^save\d+\.json$/.test(file))) {
    const baseName = basename(filename, ".json");
    result[baseName.slice(4)] = await readSaveGame(baseName);
  }

  return result;
};
