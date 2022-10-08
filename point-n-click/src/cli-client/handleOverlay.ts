import { GameStateManager } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { handleInteractions } from "./handleInteractions";
import { runScript } from "./runScript";
import { GameModelManager } from "../engine/model/gameModel";

export const handleOverlay = async <Game extends GameWorld>(
  overlayId: Game["overlays"],
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  let currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
  if (currentOverlayId !== overlayId) {
    stateManager.updateState((state) => ({
      ...state,
      overlayStack: state.overlayStack.concat(overlayId),
    }));
  }
  let overlayData = gameModelManager
    .getModel()
    .overlays.find((overlay) => overlay.id === overlayId);
  if (!overlayData) {
    // ERROR
    return;
  }

  currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
  while (currentOverlayId === overlayId) {
    const currentInteraction = stateManager.getState().currentInteraction;
    if (currentInteraction) {
      const interactionData = overlayData.interactions.find(
        (interaction) => interaction.label === currentInteraction
      );
      if (interactionData) {
        stateManager.updateState((state) => ({
          ...state,
          currentInteraction: undefined,
        }));

        await runScript<Game>(
          interactionData.script,
          gameModelManager,
          stateManager
        );
      }
    } else {
      await runScript(
        overlayData.onEnter.script,
        gameModelManager,
        stateManager
      );
    }
    currentOverlayId = stateManager.getState().overlayStack.slice(-1)[0];
    if (currentOverlayId === overlayId) {
      await handleInteractions(
        overlayData.interactions || [],
        stateManager,
        gameModelManager
      );
    }
    if (stateManager.isAborting()) return;
  }

  await runScript(overlayData.onLeave.script, gameModelManager, stateManager);
};
