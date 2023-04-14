import { GameOverlay, GameWorld, GameStateManager } from "@point-n-click/types";
import { GameModelManager } from "../model/gameModel";

export const getCurrentOverlay = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): GameOverlay<Game> | undefined | null => {
  const overlayId = stateManager.getState().overlayStack.at(-1);
  if (!overlayId) {
    return null;
  }
  return gameModelManager.getModel().overlays.find((l) => l.id === overlayId);
};
