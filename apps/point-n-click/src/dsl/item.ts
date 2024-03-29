import { GameWorld, ScriptStatement } from "@point-n-click/types";
import {
  ObjectStateDSL,
  objectStateManagement,
} from "./object-state-conditions";

export type ItemDSL<
  Game extends GameWorld,
  I extends keyof Game["items"]
> = ObjectStateDSL<Game, "item", I>;

export type ItemInterface<Game extends GameWorld> = {
  item: <I extends keyof Game["items"]>(item: I) => ItemDSL<Game, I>;
};

export const itemDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): ItemInterface<Game> => ({
  item: <I extends keyof Game["items"]>(item: I) => ({
    ...objectStateManagement(addToActiveScript, "item", item),
  }),
});
