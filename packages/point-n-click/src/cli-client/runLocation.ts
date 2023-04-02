import { GameWorld, GameStateManager } from "@point-n-click/types";
import {
  GameModelManager,
  getDisplayInfo,
  getInteractions,
} from "@point-n-click/engine";
import { handleInteractions } from "./handleInteractions";
import { renderScreen } from "./renderScreen";

export const runLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>,
  clearScreen: () => void,
  { lightMode }: { lightMode: boolean }
) => {
  const currentLocation = stateManager.getState().currentLocation;

  const locationData = gameModelManager
    .getModel()
    .locations.find((l) => l.id === currentLocation);

  if (!locationData) {
    return;
  }

  while (!stateManager.isAborting()) {
    const displayInfo = getDisplayInfo(gameModelManager, stateManager);

    if (stateManager.isAborting()) {
      return;
    }

    await renderScreen(displayInfo, gameModelManager, stateManager, {
      lightMode,
    });

    if (stateManager.isAborting()) {
      return;
    }

    const interactions = getInteractions(gameModelManager, stateManager);
    await handleInteractions(
      interactions,
      stateManager,
      gameModelManager,
      clearScreen
    );
  }
};
