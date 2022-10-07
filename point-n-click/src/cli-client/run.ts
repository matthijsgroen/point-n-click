import { GameModel } from "../dsl/ast-types";
import { GameStateManager, GameState } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { createDefaultState } from "../engine/state/createDefaultState";
import { CLISettings, updateSettings } from "./settings";
import { cls, enableKeyPresses, exitGame } from "./utils";
import { runLocation } from "./runLocation";
import { GameModelManager } from "../engine/model/gameModel";

export const runGame = async <Game extends GameWorld>(
  { color = true, translationData }: CLISettings,
  gameModelManager: GameModelManager<Game>
) => {
  updateSettings({ color, translationData });

  const model = gameModelManager.getModel();
  let gameState: GameState<Game> = {
    ...createDefaultState(model),
    ...model.settings.initialState,
  };
  if (color === false) {
    gameState.settings.cpm = Infinity;
  }

  const stateManager: GameStateManager<Game> = {
    getState: () => gameState,
    updateState: (mutation) => {
      gameState = mutation(gameState);
    },
  };
  enableKeyPresses();

  cls();
  while (true) {
    await runLocation(gameModelManager, stateManager);
  }
};
