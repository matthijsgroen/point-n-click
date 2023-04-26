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
import { observableList } from "./notificationList";

export const getDisplayInfo = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  state: GameStateManager<Game>,
  patches: Record<string, PatchFunction<GameState<Game>>> = {}
): DisplayInfo<Game>[] => {
  const displayInstructions = observableList<DisplayInfo<Game>>();
  displayInstructions.subscribe(() => {
    const patch = patches[displayInstructions.length];

    if (patch) {
      state.update(patch);
    }
  });

  const locationData = getCurrentLocation(gameModelManager, state);
  if (!locationData) {
    displayInstructions.add(noLocation(state.get().currentLocation));
    return displayInstructions.getCollection();
  }
  const globalInteractions = gameModelManager.getModel().globalInteractions;

  let currentOverlayData = getCurrentOverlay(gameModelManager, state);

  const currentInteraction = state.get().currentInteraction;

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
      state.update((state) => ({
        ...state,
        currentInteraction: undefined,
      }));

      runScript<Game>(
        interactionData.script,
        state,
        gameModelManager,
        displayInstructions
      );
      const newOverlayData = getCurrentOverlay(gameModelManager, state);
      if (newOverlayData === undefined) {
        displayInstructions.add(noOverlay(state.get().overlayStack.at(-1)));
      }
      if (currentOverlayData !== newOverlayData) {
        if (currentOverlayData) {
          runScript(
            currentOverlayData.onLeave.script,
            state,
            gameModelManager,
            displayInstructions
          );
          state.update((state) => ({
            ...state,
            currentOverlay: undefined,
          }));
        }
        if (newOverlayData) {
          state.update((state) => ({
            ...state,
            currentOverlay: newOverlayData.id,
          }));
          runScript(
            newOverlayData.onEnter.script,
            state,
            gameModelManager,
            displayInstructions
          );
        } else {
          locationDescribed = true;
          describeLocation(gameModelManager, state, displayInstructions);
        }
      }
      currentOverlayData = newOverlayData;

      const newLocationData = getCurrentLocation(gameModelManager, state);
      if (newLocationData !== locationData && !locationDescribed) {
        locationDescribed = true;
        describeLocation(gameModelManager, state, displayInstructions);
      }
    }
  } else {
    if (!locationDescribed) {
      locationDescribed = true;
      describeLocation(gameModelManager, state, displayInstructions);
    }
  }
  return displayInstructions.getCollection();
};
