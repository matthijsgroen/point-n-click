import { GameWorld } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/state";
import { describeLocation } from "../engine/describeLocation";
import { handleInteractions } from "./handleInteractions";
import { DisplayInfo, runScript } from "../engine/runScript";
import { GameModelManager } from "../engine/model/gameModel";
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
  const getCurrentOverlay = () => {
    const overlayId = stateManager.getState().overlayStack.slice(-1)[0];
    if (!overlayId) {
      return undefined;
    }
    return gameModelManager.getModel().overlays.find((l) => l.id === overlayId);
  };

  while (stateManager.getState().currentLocation === currentLocation) {
    const displayInfo: DisplayInfo<Game>[] = [];

    let currentOverlayData = getCurrentOverlay();

    const currentInteraction = stateManager.getState().currentInteraction;

    if (currentInteraction) {
      const interactionData = (
        currentOverlayData
          ? currentOverlayData.interactions
          : locationData.interactions
      ).find((interaction) => interaction.label === currentInteraction);

      if (interactionData) {
        stateManager.updateState((state) => ({
          ...state,
          currentInteraction: undefined,
        }));

        displayInfo.push(
          ...runScript<Game>(interactionData.script, stateManager)
        );
        const newOverlayData = getCurrentOverlay();
        if (currentOverlayData !== newOverlayData) {
          if (currentOverlayData) {
            displayInfo.push(
              ...runScript(currentOverlayData.onLeave.script, stateManager)
            );
          }
          if (newOverlayData) {
            displayInfo.push(
              ...runScript(newOverlayData.onEnter.script, stateManager)
            );
          } else {
            displayInfo.push(
              ...describeLocation(gameModelManager, stateManager)
            );
          }
        }
        currentOverlayData = newOverlayData;
      }
    } else {
      displayInfo.push(...describeLocation(gameModelManager, stateManager));
    }
    if (stateManager.isAborting()) {
      return;
    }

    await renderScreen(displayInfo, gameModelManager, stateManager);

    if (stateManager.isAborting()) {
      return;
    }

    currentOverlayData = getCurrentOverlay();
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
