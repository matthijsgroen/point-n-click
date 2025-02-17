import { produce } from "immer";
import { GameData } from "../syntax/dsl";
import { LocationObject, NewScript } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { getInteractions, Interaction } from "./getInteractions";
import { runScript } from "./runScript";
import { ContentPlugin, DSLExtension } from "../types/plugins";

const capitalize = <S extends string>(s: S): Capitalize<S> =>
  (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;

type Content<
  Game extends GameWorld,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[]
> = {
  actions: Action<Game>[];
  prompt: string;
  interactions: Interaction<
    Game,
    StateObject,
    keyof Game[`${StateObject}s`],
    Plugins
  >[];
};

/**
 * Content flow
 *
 * Getting from a state to a list of content,
 * and possible interactions to perform
 *
 */
const collectContentFlow = <
  Game extends GameWorld,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[]
>(
  content: GameData<Game, Plugins>,
  state: GameState<Game>
): Content<Game, Plugins> => {
  /**
   * Flow of the 'point-n-click' version ('describeLocation')
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

  const withErrorMessage = (message: string) => {
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

  const describeLocation = () => {
    const currentLocation = localState.currentLocation as string;
    const previousLocation = localState.previousLocation as string | undefined;
    const locationContent = content.locations[currentLocation];

    if (currentLocation !== previousLocation && previousLocation) {
      const previousLocationContent = content.locations[previousLocation];
      if (!previousLocationContent) {
        return withErrorMessage(
          `Previous location "${String(previousLocation)}" not found`
        );
      }
      const leaveScript = (previousLocationContent[
        `onLeaveTo${capitalize(currentLocation)}` as keyof LocationObject<
          Game,
          string,
          Plugins
        >
      ] ?? previousLocationContent.onLeave) as NewScript<
        Game,
        "location",
        string,
        Plugins
      >;

      if (leaveScript) {
        const onLeaveActions = runScript<
          Game,
          "location",
          typeof previousLocation,
          Plugins
        >(
          leaveScript,
          localState,
          content.plugins,
          "location",
          previousLocation
        );
        addActions(onLeaveActions);
      }

      if (!locationContent) {
        return withErrorMessage(
          `Location "${String(currentLocation)}" not found`
        );
      }

      const currentLocationContent = content.locations[currentLocation];
      if (currentLocationContent) {
        const enterScript = (currentLocationContent[
          `onEnterFrom${capitalize(previousLocation)}` as keyof LocationObject<
            Game,
            string,
            Plugins
          >
        ] ?? currentLocationContent?.onEnter) as NewScript<
          Game,
          "location",
          string,
          Plugins
        >;

        if (enterScript) {
          const onEnterActions = runScript<
            Game,
            "location",
            typeof currentLocation,
            Plugins
          >(
            enterScript,
            localState,
            content.plugins,
            "location",
            currentLocation
          );
          addActions(onEnterActions);
        }
      }
    }
    addActions([
      {
        type: "state",
        patch: produce((draft) => {
          draft.previousLocation =
            currentLocation as typeof draft.currentLocation;
        }),
      },
    ]);
    if (locationContent?.describe) {
      const describeActions = runScript<
        Game,
        "location",
        typeof localState.currentLocation,
        Plugins
      >(
        locationContent.describe,
        localState,
        content.plugins,
        "location",
        localState.currentLocation
      );
      addActions(describeActions);
      // Update state mutations, check if locations / overlays have change
    }
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
        typeof currentOverlayId,
        Plugins
      >(
        currentOverlayData.onLeave,
        localState,
        content.plugins,
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
      const onEnterActions = runScript<
        Game,
        "overlay",
        typeof newOverlayId,
        Plugins
      >(
        newOverlayData.onEnter,
        localState,
        content.plugins,
        "overlay",
        newOverlayId as string
      );
      addActions(onEnterActions);
    }
    if (currentOverlayId && !newOverlayId) {
      describeLocation();
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

  let locationDescribed = false;
  const currentInteraction = localState.currentInteraction;
  if (!currentInteraction) {
    locationDescribed = true;
    describeLocation();
  } else {
    if (overlayId && currentOverlayData?.interactions) {
      const overlayInteractionData = getInteractions(
        currentOverlayData.interactions,
        localState,
        "overlay",
        overlayId as string
      );
      const interactionData = overlayInteractionData.find(
        (interaction) => interaction.label === currentInteraction
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
        Plugins,
        { readonly closeOverlay: () => void }
      >(
        interactionData.action,
        localState,
        content.plugins,
        "overlay",
        overlayId
      );
      addActions(interactionActions);
    } else if (locationContent.interactions) {
      const locationInteractionData = getInteractions(
        locationContent.interactions,
        localState,
        "location",
        locationId as string
      );
      const interactionData = locationInteractionData.find(
        (interaction) => interaction.label === currentInteraction
      );
      if (!interactionData) {
        return withErrorMessage(
          `Interaction "${currentInteraction}" not found`
        );
      }
      const interactionActions = runScript<
        Game,
        "location",
        typeof locationId,
        Plugins
      >(
        interactionData.action,
        localState,
        content.plugins,
        "location",
        locationId
      );
      addActions(interactionActions);
    }

    updateOverlayState();
    if (
      localState.currentLocation !== localState.previousLocation &&
      !locationDescribed
    ) {
      locationDescribed = true;
      describeLocation();
    }
  }

  if (actions.find((action) => action.type === "error")) {
    return { actions, prompt: "Error", interactions: [] };
  }

  const interactions: Interaction<
    Game,
    StateObject,
    keyof Game[`${StateObject}s`],
    Plugins
  >[] = [];

  const finalOverlayId = localState.currentOverlay;
  const finalOverlayData = content.overlays[finalOverlayId as string];

  const finalLocationId = localState.currentLocation;
  const finalLocationData = content.locations[finalLocationId as string];
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
        keyof Game["locations" | "characters" | "items" | "overlays"],
        Plugins
      >[])
    );
  } else if (finalLocationData && finalLocationData.interactions) {
    interactions.push(
      ...getInteractions(
        finalLocationData.interactions,
        localState,
        "location",
        locationId as string
      )
    );
  }

  return { actions, prompt, interactions };
};

export type UserInteraction<Game extends GameWorld> = {
  label: string;
  enabled: boolean;
  shortcutKey?: string;
  action: (state: GameState<Game>) => GameState<Game>;
};

type ContentResult<Game extends GameWorld> = {
  actions: Action<Game>[];
  prompt: string;
  interactions: UserInteraction<Game>[];
};

export const executeContentFlow = <
  Game extends GameWorld,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[]
>(
  content: GameData<Game, Plugins>,
  state: GameState<Game>
): ContentResult<Game> => {
  const { actions, prompt, interactions } = collectContentFlow(content, state);

  const patches = actions.filter((action) => action.type === "state");
  const remainderInteractions = actions.filter(
    (action) => action.type !== "state"
  );

  const wrappedInteractions = interactions.map((interaction) => {
    const wrappedAction = (state: GameState<Game>) => {
      const patchedState = patches.reduce(
        (currentState, patch) => patch.patch(currentState),
        state
      );
      return produce((draft) => {
        draft.currentInteraction = interaction.label;
      })(patchedState);
    };

    return {
      ...interaction,
      action: wrappedAction,
    };
  });

  return {
    actions: remainderInteractions,
    prompt,
    interactions: wrappedInteractions,
  };
};
