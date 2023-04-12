import { GameWorld, WorldObjectSettings } from "./world";

export type StateObject = "item" | "location" | "character" | "overlay";

export type GameObjectState<State extends WorldObjectSettings> = {
  counters?: State["counters"] extends string
    ? {
        [key in State["counters"]]?: number;
      }
    : {};
  flags?: State["flags"] extends string
    ? {
        [key in State["flags"]]?: boolean;
      }
    : {};
  state?: State["states"] extends string
    ? State["states"] | "unknown"
    : "unknown";
  texts?: State["texts"] extends string
    ? { [key in State["texts"]]: string }
    : {};
};

export type GameState<Game extends GameWorld> = {
  currentLocation?: keyof Game["locations"];
  previousLocation?: keyof Game["locations"];
  currentInteraction?: string;
  overlayStack: (keyof Game["overlays"])[];
  currentOverlay?: keyof Game["overlays"];
  settings: {
    cpm: number;
    skipMode: "tillChoice" | "screen" | "off";
  };
  items: {
    [K in keyof Game["items"]]?: GameObjectState<Game["items"][K]>;
  };
  characters: {
    [K in keyof Game["characters"]]: GameObjectState<Game["characters"][K]> & {
      name: string | null;
      defaultName: string;
    };
  };
  locations: {
    [K in keyof Game["locations"]]: GameObjectState<Game["locations"][K]>;
  };
  overlays: {
    [K in keyof Game["overlays"]]: GameObjectState<Game["overlays"][K]>;
  };
};

export type PlayState = "playing" | "loading" | "quitting" | "reloading";

export type GameStateManager<Game extends GameWorld> = {
  getState: () => GameState<Game>;
  getSaveState: () => GameState<Game>;
  updateState: (
    mutation: (currentState: GameState<Game>) => GameState<Game>
  ) => void;

  getPlayState: () => PlayState;
  setPlayState: (state: PlayState) => void;
  isAborting: () => boolean;

  updateSaveState: () => void;
  restoreSaveState: () => void;
};
