import { GameStateManager } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { describeLocation } from "./describeLocation";
import { handleInteractions } from "./handleInteractions";
import { runScript } from "./runScript";
import { GameModelManager } from "../engine/model/gameModel";

export const runLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  await describeLocation(gameModelManager, stateManager);

  const currentLocation = stateManager.getState().currentLocation;
  const locationData = gameModelManager
    .getModel()
    .locations.find((l) => l.id === currentLocation);

  while (stateManager.getState().currentLocation === currentLocation) {
    await handleInteractions(
      locationData?.interactions || [],
      gameModelManager,
      stateManager
    );
    if (stateManager.isAborting()) {
      return;
    }
  }
  const newLocation = stateManager.getState().currentLocation;
  const exitScript = locationData?.onLeave.find(
    (item) => item.to === newLocation
  );
  if (exitScript) {
    await runScript<Game>(exitScript.script, gameModelManager, stateManager);
  }
};
