import { GameWorld } from "@point-n-click/types";
import { GameModel, GameState } from "./types";

export const createDefaultState = <Game extends GameWorld>(
  gameModel: GameModel<Game>
): GameState<Game> => ({
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
  locations: gameModel.locations.reduce<Partial<GameState<Game>["locations"]>>(
    (map, currentLocation) => {
      return {
        ...map,
        [currentLocation.id]: {
          state: "unknown",
          flags: {},
          counters: {},
        },
      };
    },
    {}
  ) as GameState<Game>["locations"],
  ...gameModel.settings.initialState,
});
