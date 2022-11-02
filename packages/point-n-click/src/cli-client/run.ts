import { GameWorld } from "@point-n-click/types";
import {
  createDefaultState,
  GameState,
  GameStateManager,
  PlayState,
} from "@point-n-click/state";
import { CLISettings, updateSettings } from "./settings";
import { cls, enableKeyPresses, startSkip, stopKeyPresses } from "./utils";
import { runLocation } from "./runLocation";
import {
  TranslationSettings,
  updateTranslation,
  GameModelManager,
} from "@point-n-click/engine";

export const runGame = async <Game extends GameWorld>(
  { color = true, translationData }: CLISettings & TranslationSettings,
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  updateSettings({ color });
  updateTranslation({ translationData });

  let model = gameModelManager.getModel();
  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
    model = gameModelManager.getModel();
  }

  enableKeyPresses();

  // cls();

  while (stateManager.getPlayState() !== "quitting") {
    await runLocation(gameModelManager, stateManager);
    if (stateManager.getPlayState() === "reloading") {
      let model = gameModelManager.getModel();
      while (!gameModelManager.hasModel()) {
        await gameModelManager.waitForChange();
        model = gameModelManager.getModel();
      }

      cls();
      stateManager.setPlayState("playing");
      startSkip();
      stateManager.restoreSaveState();
    }
  }

  stopKeyPresses();
};
