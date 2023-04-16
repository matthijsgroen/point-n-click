import {
  GameWorld,
  GameState,
  RecursivePartial,
  GameModel,
} from "@point-n-click/types";

const isObject = (o: any): o is Record<string, unknown> =>
  o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length > 0;

const mergeState = <T extends Record<string, unknown>>(
  state: T,
  updates: RecursivePartial<T>
): T => {
  const result = state;

  for (const [key, value] of Object.entries(updates)) {
    const stateValue = result[key] ?? {};
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
    currentLocation: undefined,
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
          texts: {},
          name: null,
          defaultName: settings.defaultName,
        },
      };
    }, {}) as GameState<Game>["characters"],
    locations: gameModel.locations.reduce<
      Partial<GameState<Game>["locations"]>
    >(
      (map, currentLocation) => ({
        ...map,
        [currentLocation.id]: {
          state: "unknown",
          flags: {},
          counters: {},
          texts: {},
        },
      }),
      {}
    ) as GameState<Game>["locations"],
    overlays: gameModel.overlays.reduce<Partial<GameState<Game>["overlays"]>>(
      (map, currentOverlay) => ({
        ...map,
        [currentOverlay.id]: {
          state: "unknown",
          flags: {},
          counters: {},
          texts: {},
        },
      }),
      {}
    ) as GameState<Game>["overlays"],
    lists: {},
  };
  return mergeState(startState, gameModel.settings.initialState);
};
