import { produce } from "immer";
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
  console.log("Executing content flow", state);
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
  let localState = state;

  const actions: Action<Game>[] = [];

  const addActions = (newActions: Action<Game>[]) => {
    const patches = newActions.filter((action) => action.type === "state");
    patches.forEach((patch) => {
      localState = patch.patch(localState);
    });
    actions.push(...newActions);
  };

  const describeLocation = (locationContent: LocationObject<Game, string>) => {
    if (locationContent.describe) {
      const describeActions = runScript<
        Game,
        "location",
        typeof localState.currentLocation
      >(
        locationContent.describe,
        localState,
        "location",
        localState.currentLocation
      );
      addActions(describeActions);
      // Update state mutations, check if locations / overlays have change
    }
  };

  const withErrorMessage = (message: string) => {
    console.log("DEBUG STATE, ERROR", state);
    actions.push({
      type: "error",
      message,
    });

    return {
      actions,
      prompt: "Error",
      interactions: [],
    };
  };

  const updateOverlayState = () => {
    if (
      localState.currentOverlay ===
      localState.overlayStack?.[localState.overlayStack.length - 1]
    ) {
      return;
    }

    const currentOverlayId = localState.currentOverlay;
    const newOverlayId =
      localState.overlayStack?.[localState.overlayStack.length - 1];
    const currentOverlayData = content.overlays[currentOverlayId as string];
    const newOverlayData = content.overlays[newOverlayId as string];
    if (currentOverlayId && currentOverlayData?.onLeave) {
      const onLeaveActions = runScript<
        Game,
        "overlay",
        typeof currentOverlayId
      >(
        currentOverlayData.onLeave,
        localState,
        "overlay",
        currentOverlayId as string
      );
      addActions(onLeaveActions);
    }
    addActions([
      {
        type: "state",
        patch: produce((draft) => {
          (draft.currentOverlay as string | undefined) = newOverlayId as
            | string
            | undefined;
        }),
      },
    ]);

    if (newOverlayId && newOverlayData?.onEnter) {
      const onEnterActions = runScript<Game, "overlay", typeof newOverlayId>(
        newOverlayData.onEnter,
        localState,
        "overlay",
        newOverlayId as string
      );
      addActions(onEnterActions);
    }
    if (currentOverlayId && !newOverlayId) {
      const currentLocationContent =
        content.locations[localState.currentLocation];
      if (currentLocationContent) {
        describeLocation(currentLocationContent);
      }
    }
  };

  const locationId = localState.currentLocation;
  const locationContent = content.locations[locationId as string];
  if (!locationContent) {
    return withErrorMessage(`Location "${String(locationId)}" not found`);
  }
  // TODO: Get global interactions
  // const globalInteractions = content.globalInteractions;
  const overlayId =
    localState.overlayStack?.[localState.overlayStack.length - 1];
  const currentOverlayData = content.overlays[overlayId as string];
  if (overlayId && !currentOverlayData) {
    return withErrorMessage(`Overlay "${String(overlayId)}" not found`);
  }
  console.log("locationContent", locationId, locationContent);
  console.log("overlayContent", overlayId, currentOverlayData);

  const currentInteraction = localState.currentInteraction;
  if (!currentInteraction) {
    describeLocation(locationContent);
  } else {
    if (overlayId && currentOverlayData?.interactions) {
      const overlayInteractionData = getInteractions(
        currentOverlayData.interactions,
        localState,
        "overlay",
        overlayId as string
      );
      const interactionData = overlayInteractionData.find(
        (interaction) => interaction.name === currentInteraction
      );
      if (!interactionData) {
        return withErrorMessage(
          `Interaction "${currentInteraction}" not found`
        );
      }
      const interactionActions = runScript<
        Game,
        "overlay",
        typeof overlayId,
        { readonly closeOverlay: () => void }
      >(interactionData.actionScript, localState, "overlay", overlayId);
      addActions(interactionActions);
    } else if (locationContent.interactions) {
      const locationInteractionData = getInteractions(
        locationContent.interactions,
        localState,
        "location",
        locationId as string
      );
      const interactionData = locationInteractionData.find(
        (interaction) => interaction.name === currentInteraction
      );
      if (!interactionData) {
        return withErrorMessage(
          `Interaction "${currentInteraction}" not found`
        );
      }
      const interactionActions = runScript<Game, "location", typeof locationId>(
        interactionData.actionScript,
        localState,
        "location",
        locationId
      );
      addActions(interactionActions);
    }

    updateOverlayState();
  }

  console.log("STATE before interactions", localState);
  const interactions: Interaction<
    Game,
    StateObject,
    keyof Game[`${StateObject}s`]
  >[] = [];

  const finalOverlayId = localState.currentOverlay;
  const finalOverlayData = content.overlays[finalOverlayId as string];
  let prompt = "You're going to:";
  if (finalOverlayData && finalOverlayData.interactions) {
    if (finalOverlayData.prompt) {
      prompt = finalOverlayData.prompt;
    }
    interactions.push(
      ...(getInteractions(
        finalOverlayData.interactions,
        localState,
        "overlay",
        finalOverlayId as string
      ) as Interaction<
        Game,
        StateObject,
        keyof Game["locations" | "characters" | "items" | "overlays"]
      >[])
    );
  } else if (locationContent.interactions) {
    interactions.push(
      ...getInteractions(
        locationContent.interactions,
        localState,
        "location",
        locationId as string
      )
    );
  }

  return { actions, prompt, interactions };
};
