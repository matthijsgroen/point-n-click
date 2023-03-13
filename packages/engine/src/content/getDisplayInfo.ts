import { GameWorld, GameStateManager } from "@point-n-click/types";
import { noLocation } from "../errors/noLocation";
import { GameModelManager } from "../model/gameModel";
import { describeLocation } from "./describeLocation";
import { getCurrentLocation } from "./getLocation";
import { getCurrentOverlay } from "./getOverlay";
import { DisplayInfo, runScript } from "./runScript";

export const getDisplayInfo = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): DisplayInfo<Game>[] => {
  const displayInfo: DisplayInfo<Game>[] = [];

  const locationData = getCurrentLocation(gameModelManager, stateManager);
  if (!locationData) {
    displayInfo.push(noLocation(stateManager.getState().currentLocation));
    return displayInfo;
  }
  const globalInteractions = gameModelManager.getModel().globalInteractions;

  let currentOverlayData = getCurrentOverlay(gameModelManager, stateManager);

  const currentInteraction = stateManager.getState().currentInteraction;

  if (currentInteraction) {
    const interactionData = globalInteractions
      .concat(
        currentOverlayData
          ? currentOverlayData.interactions
          : locationData.interactions
      )
      .find((interaction) => interaction.label === currentInteraction);

    if (interactionData) {
      stateManager.updateState((state) => ({
        ...state,
        currentInteraction: undefined,
      }));

      displayInfo.push(
        ...runScript<Game>(
          interactionData.script,
          stateManager,
          gameModelManager
        )
      );
      const newOverlayData = getCurrentOverlay(gameModelManager, stateManager);
      if (currentOverlayData !== newOverlayData) {
        if (currentOverlayData) {
          displayInfo.push(
            ...runScript(
              currentOverlayData.onLeave.script,
              stateManager,
              gameModelManager
            )
          );
          stateManager.updateState((state) => ({
            ...state,
            currentOverlay: undefined,
          }));
        }
        if (newOverlayData) {
          stateManager.updateState((state) => ({
            ...state,
            currentOverlay: newOverlayData.id,
          }));
          displayInfo.push(
            ...runScript(
              newOverlayData.onEnter.script,
              stateManager,
              gameModelManager
            )
          );
        } else {
          displayInfo.push(...describeLocation(gameModelManager, stateManager));
        }
      }
      currentOverlayData = newOverlayData;

      const newLocationData = getCurrentLocation(
        gameModelManager,
        stateManager
      );
      if (newLocationData !== locationData) {
        displayInfo.push(...describeLocation(gameModelManager, stateManager));
      }
    }
  } else {
    displayInfo.push(...describeLocation(gameModelManager, stateManager));
  }
  return displayInfo;
};
