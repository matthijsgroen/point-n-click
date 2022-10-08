import { GameModel } from "../dsl/ast-types";
import { GameStateManager, GameState, PlayState } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { createDefaultState } from "../engine/state/createDefaultState";
import { CLISettings, updateSettings } from "./settings";
import { cls, enableKeyPresses, exitGame, stopKeyPresses } from "./utils";
import { runLocation } from "./runLocation";
import { GameModelManager } from "../engine/model/gameModel";

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
    isAborting: () => playState === "quitting" || playState === "reloading",
  };
  enableKeyPresses();

  cls();
  while (!stateManager.isAborting()) {
    await runLocation(gameModelManager, stateManager);
  }

  stopKeyPresses();
};
