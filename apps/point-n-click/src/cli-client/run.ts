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
import { menu } from "./menu";

export const runGame = async <Game extends GameWorld>(
  {
    color = true,
    translationData,
    lightMode,
    port,
  }: CLISettings & TranslationSettings & { lightMode: boolean; port: number },
  gameModelManager: GameModelManager<Game>,
  stateManager: GameSaveStateManager<Game>,
  clearScreen: () => void
) => {
  updateSettings({ color });
  updateTranslation({ translationData });

  enableKeyPresses();

  clearScreen();

  while (stateManager.getPlayState() !== "quitting") {
    await runLocation(gameModelManager, stateManager, clearScreen, {
      lightMode,
    });
    if (stateManager.getPlayState() === "pausing") {
      await menu(gameModelManager, stateManager, { port });

      clearScreen();
      startSkip();
      stateManager.restoreSaveState();
    }
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
