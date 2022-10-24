import { GameWorld } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/state";
import { DisplayInfo, runScript } from "./runScript";
import { GameModelManager } from "../model/gameModel";
import { getCurrentLocation } from "./getLocation";

export const describeLocation = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): DisplayInfo<Game>[] => {
  const currentLocation = stateManager.getState().currentLocation;
  const locationData = getCurrentLocation(gameModelManager, stateManager);

  const result: DisplayInfo<Game>[] = [];

  if (!locationData) {
    // TODO: Return this as displayInfo 'Error'
    console.log(`Location not found: ${String(currentLocation)}`);
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
        result.push(...runScript<Game>(exitScript.script, stateManager));
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
      result.push(...runScript<Game>(enterScript.script, stateManager));
    }
  }

  result.push(
    ...runScript<Game>(locationData?.describe.script || [], stateManager)
  );

  return result;
};