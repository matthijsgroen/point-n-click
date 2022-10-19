import { GameWorld } from "@point-n-click/types";
import {
  GameModelManager,
  getDisplayInfo,
  getCurrentOverlay,
} from "@point-n-click/engine";
import { GameStateManager } from "@point-n-click/state";
import { handleInteractions } from "./handleInteractions";
import { renderScreen } from "./renderScreen";

export const runLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  const currentLocation = stateManager.getState().currentLocation;

  const locationData = gameModelManager
    .getModel()
    .locations.find((l) => l.id === currentLocation);

  if (!locationData) {
    return;
  }

  while (stateManager.getState().currentLocation === currentLocation) {
    const displayInfo = getDisplayInfo(gameModelManager, stateManager);

    if (stateManager.isAborting()) {
      return;
    }

    await renderScreen(displayInfo, gameModelManager, stateManager);

    if (stateManager.isAborting()) {
      return;
    }

    const currentOverlayData = getCurrentOverlay(
      gameModelManager,
      stateManager
    );
    if (stateManager.getState().currentLocation === currentLocation) {
      await handleInteractions(
        (currentOverlayData
          ? currentOverlayData.interactions
          : locationData.interactions) ?? [],
        stateManager,
        gameModelManager
      );
    }
    if (stateManager.isAborting()) {
      return;
    }
  }
};
