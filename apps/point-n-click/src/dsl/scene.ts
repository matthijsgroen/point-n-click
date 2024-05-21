import { GameWorld, ScriptStatement } from "@point-n-click/types";

export type SceneInterface<Game extends GameWorld> = {
  playScene: (scene: Game["scenes"]) => void;
};

export const sceneDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): SceneInterface<Game> => ({
  playScene: (scene: Game["scenes"]) => {
    addToActiveScript({
      statementType: "PlayScene",
      scene: String(scene),
    });
  },
});
