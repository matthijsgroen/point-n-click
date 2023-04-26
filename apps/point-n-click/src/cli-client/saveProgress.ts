import { GameSaveStateManager, GameWorld } from "@point-n-click/types";
import { writeFile } from "fs/promises";
import { join } from "path";

export const saveProgress = async <Game extends GameWorld>(
  stateManager: GameSaveStateManager<Game>
) => {
  const autoSavePath = join(process.cwd(), ".autosave.json");
  await writeFile(
    autoSavePath,
    JSON.stringify(stateManager.stableState().get()),
    {
      encoding: "utf-8",
    }
  );
};
