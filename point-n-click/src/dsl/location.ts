import { ScriptStatement } from "./ast-types";
import {
  ObjectStateDSL,
  objectStateManagement,
} from "./object-state-conditions";
import { GameWorld } from "./world-types";

export type LocationDSL<
  Game extends GameWorld,
  I extends keyof Game["locations"]
> = ObjectStateDSL<Game, "location", I>;

export type LocationInterface<Game extends GameWorld> = {
  location: <I extends keyof Game["locations"]>(
    location: I
  ) => LocationDSL<Game, I>;
  travel: (location: keyof Game["locations"]) => void;
};

export const locationDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): LocationInterface<Game> => ({
  location: <I extends keyof Game["locations"]>(location: I) => ({
    ...objectStateManagement(addToActiveScript, "location", location),
  }),
  travel: (location: keyof Game["locations"]) => {
    addToActiveScript({
      statementType: "Travel",
      destination: String(location),
    });
  },
});
