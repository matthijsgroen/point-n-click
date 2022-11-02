import { GameWorld } from "@point-n-click/types";
import { GameModel, Settings } from "./types";

export const emptyGameModel = <Game extends GameWorld>(): GameModel<Game> => ({
  settings: {
    gameTitle: "My new game",
    defaultLocale: "en-US",
    initialState: {},
    characterConfigs: {} as Settings<Game>["characterConfigs"],
  },
  locations: [],
  overlays: [],
  themes: [],
  globalInteractions: [],
});
