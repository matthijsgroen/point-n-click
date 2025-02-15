import { GameWorld, ScriptStatement } from "@point-n-click/types";
import {
  ObjectStateDSL,
  objectStateManagement,
} from "./object-state-conditions";

export type OverlayDSL<
  Game extends GameWorld,
  I extends keyof Game["overlays"]
> = ObjectStateDSL<Game, "overlay", I> & {
  open: () => void;
};

export type OverlayInterface<Game extends GameWorld> = {
  overlay: <I extends keyof Game["overlays"]>(
    overlay: I
  ) => OverlayDSL<Game, I>;
};

export const overlayDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): OverlayInterface<Game> => ({
  overlay: <I extends keyof Game["overlays"]>(overlay: I) => ({
    ...objectStateManagement(addToActiveScript, "overlay", overlay),
    open: () => {
      addToActiveScript({
        statementType: "OpenOverlay",
        overlayId: overlay,
      });
    },
  }),
});
