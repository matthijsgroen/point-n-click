import { GameWorld, GameStateManager } from "@point-n-click/types";
import { DisplayInfo, runScript } from "./runScript";
import { GameModelManager } from "../model/gameModel";
import { getCurrentLocation } from "./getLocation";
import { noLocation } from "../errors/noLocation";
import { noOverlay } from "../errors/noOverlay";
import { getCurrentOverlay } from "./getOverlay";
import { ObservableList } from "./notificationList";

export const describeLocation = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  state: GameStateManager<Game>,
  list: ObservableList<DisplayInfo<Game>>
): void => {
  const currentLocation = state.get().currentLocation;
  const locationData = getCurrentLocation(gameModelManager, state);

  if (!locationData) {
    list.add(noLocation(state.get().currentLocation));
  }

  const previousLocation = state.get().previousLocation;

  if (currentLocation !== previousLocation) {
    const previousLocationData = gameModelManager
      .getModel()
      .locations.find((l) => l.id === previousLocation);
    if (previousLocationData) {
      const exitScript = previousLocationData.onLeave.find(
        (item) => item.to === currentLocation
      );
      if (exitScript) {
        runScript<Game>(exitScript.script, state, gameModelManager, list);
      }
    }

    const enterScript = locationData?.onEnter.find(
      (item) => item.from === previousLocation
    );
    state.update((state) => ({
      ...state,
      previousLocation: currentLocation,
    }));
    if (enterScript) {
      runScript<Game>(enterScript.script, state, gameModelManager, list);
    }
  }

  runScript<Game>(
    locationData?.describe.script || [],
    state,
    gameModelManager,
    list
  );
  // When location changes happen during a location description,
  // this needs to be updated to get the proper translation key
  state.update((state) => ({
    ...state,
    previousLocation: state.currentLocation,
  }));
  let newOverlayData = getCurrentOverlay(gameModelManager, state);
  if (newOverlayData === undefined) {
    list.add(noOverlay(state.get().overlayStack.at(-1)));
  }

  if (newOverlayData) {
    const overlayData = newOverlayData;
    state.update((state) => ({
      ...state,
      currentOverlay: overlayData.id,
    }));
    runScript(overlayData.onEnter.script, state, gameModelManager, list);
  }
};
