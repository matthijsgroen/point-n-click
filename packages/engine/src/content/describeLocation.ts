import { GameWorld, GameStateManager } from "@point-n-click/types";
import { DisplayInfo, runScript } from "./runScript";
import { GameModelManager } from "../model/gameModel";
import { getCurrentLocation } from "./getLocation";
import { noLocation } from "../errors/noLocation";
import { getCurrentOverlay } from "./getOverlay";

export const describeLocation = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): DisplayInfo<Game>[] => {
  const currentLocation = stateManager.getState().currentLocation;
  const locationData = getCurrentLocation(gameModelManager, stateManager);

  const result: DisplayInfo<Game>[] = [];

  if (!locationData) {
    result.push(noLocation(stateManager.getState().currentLocation));
  }

  const previousLocation = stateManager.getState().previousLocation;

  if (currentLocation !== previousLocation) {
    const previousLocationData = gameModelManager
      .getModel()
      .locations.find((l) => l.id === previousLocation);
    if (previousLocationData) {
      const exitScript = previousLocationData.onLeave.find(
        (item) => item.to === currentLocation
      );
      if (exitScript) {
        result.push(
          ...runScript<Game>(exitScript.script, stateManager, gameModelManager)
        );
      }
    }

    const enterScript = locationData?.onEnter.find(
      (item) => item.from === previousLocation
    );
    stateManager.updateState((state) => ({
      ...state,
      previousLocation: currentLocation,
    }));
    if (enterScript) {
      result.push(
        ...runScript<Game>(enterScript.script, stateManager, gameModelManager)
      );
    }
  }

  result.push(
    ...runScript<Game>(
      locationData?.describe.script || [],
      stateManager,
      gameModelManager
    )
  );
  let newOverlayData = getCurrentOverlay(gameModelManager, stateManager);

  if (newOverlayData) {
    const overlayData = newOverlayData;
    stateManager.updateState((state) => ({
      ...state,
      currentOverlay: overlayData.id,
    }));
    result.push(
      ...runScript(overlayData.onEnter.script, stateManager, gameModelManager)
    );
  }
  return result;
};
