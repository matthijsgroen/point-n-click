import { GameWorld, GameStateManager, GameModel } from "@point-n-click/types";
import {
  GameModelManager,
  getDisplayInfo,
  getInteractions,
} from "@point-n-click/engine";
import { handleInteractions } from "./handleInteractions";
import { renderDisplayInfo } from "./renderDisplayInfo";

export const runLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>,
  clearScreen: () => void,
  { lightMode }: { lightMode: boolean }
) => {
  const currentLocation = stateManager.getState().currentLocation;

  const locationData = gameModelManager
    .getModel()
    .locations.find(
      (l: GameModel<Game>["locations"][number]) => l.id === currentLocation
    );

  if (!locationData) {
    return;
  }

  while (!stateManager.isAborting()) {
    const displayInfo = getDisplayInfo(gameModelManager, stateManager);

    if (stateManager.isAborting()) {
      return;
    }
    for (const item of displayInfo) {
      await renderDisplayInfo(item, gameModelManager, stateManager, {
        lightMode,
      });

      if (stateManager.isAborting()) {
        return;
      }
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
