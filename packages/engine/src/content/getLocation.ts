import { GameStateManager } from "@point-n-click/state";
import { GameLocation, GameWorld } from "@point-n-click/types";
import { GameModelManager } from "../model/gameModel";

export const getCurrentLocation = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): GameLocation<Game> | undefined => {
  const locationId = stateManager.getState().currentLocation;
  if (!locationId) {
    return undefined;
  }
  return gameModelManager.getModel().locations.find((l) => l.id === locationId);
};
