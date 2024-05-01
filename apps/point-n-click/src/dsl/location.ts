import { GameWorld, ScriptStatement } from "@point-n-click/types";
import {
  ObjectStateDSL,
  objectStateManagement,
} from "./object-state-conditions";

export type LocationDSL<
  Game extends GameWorld,
  I extends keyof Game["locations"]
> = ObjectStateDSL<Game, "location", I> & {
  travel: () => void;
};

export type LocationInterface<Game extends GameWorld> = {
  location: <I extends keyof Game["locations"]>(
    location: I
  ) => LocationDSL<Game, I>;
};

export const locationDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): LocationInterface<Game> => ({
  location: <I extends keyof Game["locations"]>(location: I) => ({
    ...objectStateManagement(addToActiveScript, "location", location),
    travel: () => {
      addToActiveScript({
        statementType: "Travel",
        destination: String(location),
      });
    },
  }),
});
