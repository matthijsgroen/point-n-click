import { GameWorld, WorldObjectSettings } from "./world";

export type StateObject = "item" | "location" | "character";

export type GameObjectState<State extends WorldObjectSettings> =
  (State["counters"] extends string
    ? {
        counters: {
          [key in State["counters"]]?: number;
        };
      }
    : {}) &
    (State["flags"] extends string
      ? {
          flags: {
            [key in State["flags"]]?: boolean;
          };
        }
      : {}) &
    (State["states"] extends string
      ? {
          state: State["states"] | "unknown";
        }
      : {}) &
    (State["texts"] extends string
      ? {
          texts: { [key in State["texts"]]: string };
        }
      : {});

export type GameState<Game extends GameWorld> = {
  currentLocation?: keyof Game["locations"];
  previousLocation?: keyof Game["locations"];
  currentInteraction?: string;
  overlayStack: Game["overlays"][];
  currentOverlay?: Game["overlays"];
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
