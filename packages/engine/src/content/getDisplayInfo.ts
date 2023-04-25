import {
  GameWorld,
  GameStateManager,
  GameState,
  PatchFunction,
} from "@point-n-click/types";
import { noLocation } from "../errors/noLocation";
import { GameModelManager } from "../model/gameModel";
import { describeLocation } from "./describeLocation";
import { getCurrentLocation } from "./getLocation";
import { getCurrentOverlay } from "./getOverlay";
import { DisplayInfo, runScript } from "./runScript";
import { noOverlay } from "../errors/noOverlay";
import { notificationList } from "./notificationList";

export const getDisplayInfo = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>,
  patches: Record<string, PatchFunction<GameState<Game>>> = {}
): DisplayInfo<Game>[] => {
  const displayInstructions = notificationList<DisplayInfo<Game>>();
  displayInstructions.subscribe(() => {
    const patch = patches[displayInstructions.getCollection().length];

    if (patch) {
      stateManager.update(patch);
    }
  });

  const locationData = getCurrentLocation(gameModelManager, stateManager);
  if (!locationData) {
    displayInstructions.add(noLocation(stateManager.get().currentLocation));
    return displayInstructions.getCollection();
  }
  const globalInteractions = gameModelManager.getModel().globalInteractions;

  let currentOverlayData = getCurrentOverlay(gameModelManager, stateManager);

  const currentInteraction = stateManager.get().currentInteraction;

  let locationDescribed = false;

  if (currentInteraction) {
    const interactionData = globalInteractions
      .concat(
        currentOverlayData
          ? currentOverlayData.interactions
          : locationData.interactions
      )
      .find((interaction) => interaction.label === currentInteraction);

    if (interactionData) {
      stateManager.update((state) => ({
        ...state,
        currentInteraction: undefined,
      }));

      runScript<Game>(
        interactionData.script,
        stateManager,
        gameModelManager,
        displayInstructions
      );
      const newOverlayData = getCurrentOverlay(gameModelManager, stateManager);
      if (newOverlayData === undefined) {
        displayInstructions.add(
          noOverlay(stateManager.get().overlayStack.at(-1))
        );
      }
      if (currentOverlayData !== newOverlayData) {
        if (currentOverlayData) {
          runScript(
            currentOverlayData.onLeave.script,
            stateManager,
            gameModelManager,
            displayInstructions
          );
          stateManager.update((state) => ({
            ...state,
            currentOverlay: undefined,
          }));
        }
        if (newOverlayData) {
          stateManager.update((state) => ({
            ...state,
            currentOverlay: newOverlayData.id,
          }));
          runScript(
            newOverlayData.onEnter.script,
            stateManager,
            gameModelManager,
            displayInstructions
          );
        } else {
          locationDescribed = true;
          describeLocation(gameModelManager, stateManager, displayInstructions);
        }
      }
      currentOverlayData = newOverlayData;

      const newLocationData = getCurrentLocation(
        gameModelManager,
        stateManager
      );
      if (newLocationData !== locationData && !locationDescribed) {
        locationDescribed = true;
        describeLocation(gameModelManager, stateManager, displayInstructions);
      }
    }
  } else {
    if (!locationDescribed) {
      locationDescribed = true;
      describeLocation(gameModelManager, stateManager, displayInstructions);
    }
  }
  return displayInstructions.getCollection();
};
