import { GameModelManager } from "@point-n-click/engine";
import { createDefaultState } from "@point-n-click/state";
import {
  GameSaveStateManager,
  GameState,
  GameWorld,
  PlayState,
  createState,
} from "@point-n-click/types";
import { produce } from "immer";

export const createGameSaveStateManager = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>
): Promise<GameSaveStateManager<Game>> => {
  let model = gameModelManager.getModel();
  while (!gameModelManager.hasModel()) {
    await gameModelManager.waitForChange();
    model = gameModelManager.getModel();
  }

  const gameState = createState(createDefaultState(model));
  const savePoint = createState(createDefaultState(model));

  let playState: PlayState = "playing";

  const stateManager: GameSaveStateManager<Game> = {
    activeState: () => gameState,
    stableState: () => savePoint,

    getState: () => gameState.get(),
    updateState: (mutation) => {
      gameState.update(mutation);
    },

    setPlayState: (state) => {
      playState = state;
    },
    getPlayState: () => playState,

    getSaveState: () => savePoint.get(),
    updateSaveState: () => {
      savePoint.update(() => gameState.get());
    },

    storeInput: (key, value) => {
      savePoint.update(
        produce<GameState<Game>>((draft) => {
          draft.inputs[key] = value;
        })
      );
    },

    restoreSaveState: () => {
      gameState.update(() => savePoint.get());
    },
    isAborting: () => playState === "quitting" || playState === "reloading",
  };
  return stateManager;
};
