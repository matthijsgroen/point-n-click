import { GameWorld } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/state";
import { describeLocation } from "./describeLocation";
import { handleInteractions } from "./handleInteractions";
import { runScript } from "./runScript";
import { GameModelManager } from "../engine/model/gameModel";
import { handleOverlay } from "./handleOverlay";

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
    const currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
    if (currentOverlayId) {
      await handleOverlay(currentOverlayId, gameModelManager, stateManager);
    }

    const currentInteraction = stateManager.getState().currentInteraction;
    if (currentInteraction) {
      const interactionData = locationData.interactions.find(
        (interaction) => interaction.label === currentInteraction
      );
      if (interactionData) {
        stateManager.updateState((state) => ({
          ...state,
          currentInteraction: undefined,
        }));

        await runScript<Game>(
          interactionData.script,
          gameModelManager,
          stateManager
        );
      }
    } else {
      await describeLocation(gameModelManager, stateManager);
    }
    if (stateManager.isAborting()) {
      return;
    }

    if (stateManager.getState().currentLocation === currentLocation) {
      await handleInteractions(
        locationData.interactions || [],
        stateManager,
        gameModelManager
      );
    }
    if (stateManager.isAborting()) {
      return;
    }
  }
  const newLocation = stateManager.getState().currentLocation;
  const exitScript = locationData.onLeave.find(
    (item) => item.to === newLocation
  );
  if (exitScript) {
    await runScript<Game>(exitScript.script, gameModelManager, stateManager);
    return;
  }
};
