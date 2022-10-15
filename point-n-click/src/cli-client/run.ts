import { GameWorld } from "@point-n-click/types";
import { GameState, GameStateManager, PlayState } from "@point-n-click/state";
import { GameModelManager } from "../engine/model/gameModel";
import { createDefaultState } from "../../../state/src/createDefaultState";
import { CLISettings, updateSettings } from "./settings";
import { cls, enableKeyPresses, startSkip, stopKeyPresses } from "./utils";
import { runLocation } from "./runLocation";

export const runGame = async <Game extends GameWorld>(
  { color = true, translationData }: CLISettings,
  gameModelManager: GameModelManager<Game>
) => {
  updateSettings({ color, translationData });

  let model = gameModelManager.getModel();
  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
    model = gameModelManager.getModel();
  }

  let gameState: GameState<Game> = {
    ...createDefaultState(model),
    ...model.settings.initialState,
  };
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
