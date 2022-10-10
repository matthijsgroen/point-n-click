import { GameModel } from "../dsl/ast-types";
import { GameStateManager } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { runScript } from "./runScript";
import { exitGame } from "./utils";
import { GameModelManager } from "../engine/model/gameModel";

export const describeLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  const currentLocation = stateManager.getState().currentLocation;
  const locationData = gameModelManager
    .getModel()
    .locations.find((l) => l.id === currentLocation);

  if (!locationData) {
    console.log(`Location not found: ${String(currentLocation)}`);
    exitGame(1);
  }

  const previousLocation = stateManager.getState().previousLocation;
  if (currentLocation !== previousLocation) {
    const enterScript = locationData?.onEnter.find(
      (item) => item.from === previousLocation
    );
    stateManager.updateState((state) => ({
      ...state,
      previousLocation: currentLocation,
    }));
    if (enterScript) {
      await runScript<Game>(enterScript.script, gameModelManager, stateManager);
    }
  }

  await runScript<Game>(
    locationData?.describe.script || [],
    gameModelManager,
    stateManager
  );
};
