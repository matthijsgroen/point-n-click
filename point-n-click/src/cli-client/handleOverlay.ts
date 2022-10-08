import { GameModel, ScriptAST, GameInteraction } from "../dsl/ast-types";
import { GameStateManager } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { handleInteractions } from "./handleInteractions";
import { runScript } from "./runScript";
import { GameModelManager } from "../engine/model/gameModel";

export const handleOverlay = async <Game extends GameWorld>(
  overlayId: string,
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>,
  startScript: ScriptAST<Game>,
  endScript: ScriptAST<Game>,
  interactions: GameInteraction<Game>[]
) => {
  stateManager.updateState((state) => ({
    ...state,
    overlayStack: state.overlayStack.concat(overlayId),
  }));

  await runScript(startScript, gameModelManager, stateManager);

  let currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
  do {
    await handleInteractions(
      interactions || [],
      gameModelManager,
      stateManager
    );
    currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
    if (stateManager.isAborting()) return;
  } while (currentOverlayId === overlayId);

  await runScript(endScript, gameModelManager, stateManager);
};
