import { GameStateManager } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";

export const determineTextScope = <Game extends GameWorld>(
  stateManager: GameStateManager<Game>,
  entry: string
): string[] => {
  const overlay = stateManager.getState().overlayStack.at(-1);
  if (overlay) {
    return ["overlays", String(overlay), entry];
  }
  const location = String(stateManager.getState().previousLocation);
  return ["location", location, entry];
};
