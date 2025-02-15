import {
  GameSaveStateManager,
  GameState,
  GameWorld,
} from "@point-n-click/types";
import { writeFile } from "fs/promises";
import { join } from "path";

export type Save<Game extends GameWorld> = {
  name: string;
  time: string;
  content: GameState<Game>;
};

export const saveProgress = async <Game extends GameWorld>(
  stateManager: GameSaveStateManager<Game>
) => saveGame("autosave", "autosave", stateManager);

export const saveGame = async <Game extends GameWorld>(
  name: string,
  filename: string,
  stateManager: GameSaveStateManager<Game>
) => {
  const savePath = join(process.cwd(), "saves", `${filename}.json`);
  const saveContents: Save<Game> = {
    name,
    time: new Date().toJSON(),
    content: stateManager.stableState().get(),
  };
  await writeFile(savePath, JSON.stringify(saveContents), {
    encoding: "utf-8",
  });
};
