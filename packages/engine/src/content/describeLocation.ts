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
  stateManager: GameStateManager<Game>,
  list: ObservableList<DisplayInfo<Game>>
): void => {
  const currentLocation = stateManager.get().currentLocation;
  const locationData = getCurrentLocation(gameModelManager, stateManager);

  if (!locationData) {
    list.add(noLocation(stateManager.get().currentLocation));
  }

  const previousLocation = stateManager.get().previousLocation;

  if (currentLocation !== previousLocation) {
    const previousLocationData = gameModelManager
      .getModel()
      .locations.find((l) => l.id === previousLocation);
    if (previousLocationData) {
      const exitScript = previousLocationData.onLeave.find(
        (item) => item.to === currentLocation
      );
      if (exitScript) {
        runScript<Game>(
          exitScript.script,
          stateManager,
          gameModelManager,
          list
        );
      }
    }

    const enterScript = locationData?.onEnter.find(
      (item) => item.from === previousLocation
    );
    stateManager.update((state) => ({
      ...state,
      previousLocation: currentLocation,
    }));
    if (enterScript) {
      runScript<Game>(enterScript.script, stateManager, gameModelManager, list);
    }
  }

  runScript<Game>(
    locationData?.describe.script || [],
    stateManager,
    gameModelManager,
    list
  );
  // When location changes happen during a location description,
  // this needs to be updated to get the proper translation key
  stateManager.update((state) => ({
    ...state,
    previousLocation: state.currentLocation,
  }));
  let newOverlayData = getCurrentOverlay(gameModelManager, stateManager);
  if (newOverlayData === undefined) {
    list.add(noOverlay(stateManager.get().overlayStack.at(-1)));
  }

  if (newOverlayData) {
    const overlayData = newOverlayData;
    stateManager.update((state) => ({
      ...state,
      currentOverlay: overlayData.id,
    }));
    runScript(overlayData.onEnter.script, stateManager, gameModelManager, list);
  }
};
