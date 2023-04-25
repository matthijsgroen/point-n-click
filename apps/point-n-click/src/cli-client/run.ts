import { GameWorld, GameSaveStateManager } from "@point-n-click/types";
import { createDefaultState, mergeState } from "@point-n-click/state";
import { CLISettings, updateSettings } from "./settings";
import { enableKeyPresses, startSkip, stopKeyPresses } from "./utils";
import { runLocation } from "./runLocation";
import {
  TranslationSettings,
  updateTranslation,
  GameModelManager,
} from "@point-n-click/engine";

export const runGame = async <Game extends GameWorld>(
  {
    color = true,
    translationData,
    lightMode,
  }: CLISettings & TranslationSettings & { lightMode: boolean },
  gameModelManager: GameModelManager<Game>,
  stateManager: GameSaveStateManager<Game>,
  clearScreen: () => void
) => {
  updateSettings({ color });
  updateTranslation({ translationData });

  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
  }

  enableKeyPresses();

  clearScreen();

  while (stateManager.getPlayState() !== "quitting") {
    await runLocation(gameModelManager, stateManager, clearScreen, {
      lightMode,
    });
    if (stateManager.getPlayState() === "reloading") {
      let model = gameModelManager.getModel();
      while (!gameModelManager.hasModel()) {
        await gameModelManager.waitForChange();
        model = gameModelManager.getModel();

        const newStartState = createDefaultState(model);
        const mergedState = mergeState(
          newStartState,
          stateManager.stableState().get()
        );
        stateManager.activeState().update(() => mergedState);
        stateManager.updateSaveState();
      }

      clearScreen();
      stateManager.setPlayState("playing");
      startSkip();
      stateManager.restoreSaveState();
    }
  }

  stopKeyPresses();
};
