import { GameData } from "../syntax/dsl";
import { LocationObject } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { getInteractions, Interaction } from "./getInteractions";
import { runScript } from "./runScript";

type Content<Game extends GameWorld> = {
  actions: Action<Game>[];
  prompt: string;
  interactions: Interaction<Game, StateObject, keyof Game[`${StateObject}s`]>[];
};

/**
 * Content flow
 *
 * Getting from a state to a list of content,
 * and possible interactions to perform
 *
 */
export const executeContentFlow = <Game extends GameWorld>(
  content: GameData<Game>,
  state: GameState<Game>
): Content<Game> => {
  /**
   * Flow of the 'point-n-click' version ('describeLocation')
   *
   * # DescribeLocation
   *
   * - Get the current location
   * - Get the previous location
   * - If the current location is different from the previous location
   *   - Run the 'onLeave' script of the previous location
   *   - Update the previous location
   *   - Run the 'onEnter' script of the current location
   * - Run the 'describe' script of the current location
   * - Update the previous location
   *
   * - Get the current overlay
   * - Run the 'onEnter' script of the current overlay
   *
   *
   * # GetDisplayInfo
   *
   * - If interaction is set
   * - Get the interaction data (from global or local overlay / location)
   * - Run the interaction script
   *
   * - If the interaction script changes the overlay
   *   - Run the 'onLeave' script of the current overlay
   *   - Update the current overlay
   * - If there is still an overlay set (not undefined)
   *   - Run the 'onEnter' script of the new overlay
   * - If there is no overlay set (and overlay was set before)
   *   - Describe the location (#DescribeLocation)
   *
   * - If location has changed and was not yet described
   *   - Describe the location (#DescribeLocation)
   *
   * - If no interaction is set
   *  - Describe the location (#DescribeLocation)
   *
   */
  //   const seed = state.lastInteractionAt ?? Date.now();

  //   const randomNumber = mulberry32(seed);
  const actions: Action<Game>[] = [];

  const describeLocation = (locationContent: LocationObject<Game, string>) => {
    if (locationContent.describe) {
      const describeActions = runScript<
        Game,
        "location",
        typeof state.currentLocation
      >(locationContent.describe, state, "location", state.currentLocation);
      actions.push(...describeActions);
      // Update state mutations, check if locations / overlays have change
    }
  };

  const locationId = state.currentLocation;
  const locationContent = content.locations[locationId as string];
  if (!locationContent) {
    actions.push({
      type: "error",
      message: `Location ${String(state.currentLocation)} not found`,
    });

    return {
      actions,
      prompt: "Er is geen locatie gevonden",
      interactions: [],
    };
  }
  // TODO: Get global interactions
  // const globalInteractions = content.globalInteractions;
  const overlayId = state.overlayStack?.[state.overlayStack.length - 1];
  const currentOverlayData = content.overlays[overlayId as string];
  if (overlayId && !currentOverlayData) {
    actions.push({
      type: "error",
      message: `Overlay ${String(overlayId)} not found`,
    });

    return {
      actions,
      prompt: "Er is geen locatie gevonden",
      interactions: [],
    };
  }
  console.log("locationContent", locationContent);
  console.log("overlayContent", currentOverlayData);

  const currentInteraction = state.currentInteraction;
  if (!currentInteraction) {
    describeLocation(locationContent);
  }

  const interactions: Interaction<
    Game,
    StateObject,
    keyof Game[`${StateObject}s`]
  >[] = [];

  if (currentOverlayData && currentOverlayData.interactions) {
    interactions.push(
      ...getInteractions(
        currentOverlayData.interactions,
        state,
        "overlay",
        overlayId as string
      )
    );
  } else if (locationContent.interactions) {
    interactions.push(
      ...getInteractions(
        locationContent.interactions,
        state,
        "location",
        locationId as string
      )
    );
  }

  return {
    actions,
    prompt: "Your going to:",
    interactions,
  };
};
