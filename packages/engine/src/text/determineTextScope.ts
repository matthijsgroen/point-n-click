import { GameWorld, GameStateManager } from "@point-n-click/types";

export const determineTextScope = <Game extends GameWorld>(
  stateManager: GameStateManager<Game>,
  entry: string
): string[] => {
  const scene = stateManager.get().currentScene;
  if (scene) {
    return ["scenes", String(scene), entry];
  }
  const overlay = stateManager.get().currentOverlay;
  if (overlay) {
    return ["overlays", String(overlay), entry];
  }
  const location = String(stateManager.get().previousLocation);
  return ["locations", location, entry];
};
