import { GameStateManager } from "@point-n-click/state";
import { GameOverlay, GameWorld } from "@point-n-click/types";
import { GameModelManager } from "../model/gameModel";

export const getCurrentOverlay = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): GameOverlay<Game> | undefined => {
  const overlayId = stateManager.getState().overlayStack.slice(-1)[0];
  if (!overlayId) {
    return undefined;
  }
  return gameModelManager.getModel().overlays.find((l) => l.id === overlayId);
};
