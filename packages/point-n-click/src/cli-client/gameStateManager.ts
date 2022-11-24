import { GameModelManager } from "@point-n-click/engine";
import { createDefaultState } from "@point-n-click/state";
import {
  GameState,
  GameStateManager,
  GameWorld,
  PlayState,
} from "@point-n-click/types";

export const createGameStateManager = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>
): Promise<GameStateManager<Game>> => {
  let model = gameModelManager.getModel();
  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
    model = gameModelManager.getModel();
  }

  let gameState: GameState<Game> = createDefaultState(model);
  let savePoint = gameState;

  let playState: PlayState = "playing";

  const stateManager: GameStateManager<Game> = {
    getState: () => gameState,
    getSaveState: () => savePoint,
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
  return stateManager;
};
