import { GameModel, GameWorld, Settings } from "@point-n-click/types";

export const emptyGameModel = <Game extends GameWorld>(): GameModel<Game> => ({
  settings: {
    gameTitle: "My new game",
    locales: {
      default: "en-US",
      supported: {
        "en-US": "English",
      },
    },
    initialState: {
      version: 0,
    },
    characterConfigs: {} as Settings<Game>["characterConfigs"],
    colors: {
      lightPalette: {},
      darkPalette: {},
    },
  },
  locations: [],
  overlays: [],
  globalInteractions: [],
  themes: [],
  diagram: {
    events: {},
  },
  worldMap: { start: undefined, locations: {} },
});
