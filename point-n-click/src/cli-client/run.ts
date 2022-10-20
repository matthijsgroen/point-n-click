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
  gameModelManager: GameModelManager<Game>
) => {
  updateSettings({ color });
  updateTranslation({ translationData });

  let model = gameModelManager.getModel();
  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
    model = gameModelManager.getModel();
  }

  let gameState: GameState<Game> = createDefaultState(model);
  let savePoint = gameState;
  if (color === false) {
    gameState.settings.cpm = Infinity;
  }

  let playState: PlayState = "playing";

  const stateManager: GameStateManager<Game> = {
    getState: () => gameState,
    updateState: (mutation) => {
      gameState = mutation(gameState);
    },
    setPlayState: (state) => {
      playState = state;
    },
    getPlayState: () => playState,
    updateSaveState: () => {
      savePoint = gameState;
    },
    restoreSaveState: () => {
      gameState = savePoint;
    },
    isAborting: () => playState === "quitting" || playState === "reloading",
  };
  enableKeyPresses();

  cls();

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
