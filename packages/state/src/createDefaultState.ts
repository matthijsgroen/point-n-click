import { GameWorld } from "@point-n-click/types";
import { GameModel, GameState, RecursivePartial } from "./types";

const isObject = (o: any): o is Record<string, unknown> =>
  o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length > 0;

const mergeState = <T extends Record<string, unknown>>(
  state: T,
  updates: RecursivePartial<T>
): T => {
  const result = state;

  for (const [key, value] of Object.entries(updates)) {
    const stateValue = result[key];
    (result as Record<string, unknown>)[key] = isObject(value)
      ? mergeState(stateValue as Record<string, unknown>, value)
      : value;
  }

  return result;
};

export const createDefaultState = <Game extends GameWorld>(
  gameModel: GameModel<Game>
): GameState<Game> => {
  const startState: GameState<Game> = {
    currentLocation: gameModel.locations[0]?.id,
    overlayStack: [],
    settings: {
      cpm: 3000,
      skipMode: "off",
    },
    items: {},
    characters: Object.entries(gameModel.settings.characterConfigs).reduce<
      Partial<GameState<Game>["characters"]>
    >((map, [characterId, settings]) => {
      return {
        ...map,
        [characterId]: {
          state: "unknown",
          flags: {},
          counters: {},
          name: null,
          defaultName: settings.defaultName,
        },
      };
    }, {}) as GameState<Game>["characters"],
    locations: gameModel.locations.reduce<
      Partial<GameState<Game>["locations"]>
    >((map, currentLocation) => {
      return {
        ...map,
        [currentLocation.id]: {
          state: "unknown",
          flags: {},
          counters: {},
        },
      };
    }, {}) as GameState<Game>["locations"],
  };
  return mergeState(startState, gameModel.settings.initialState);
};
