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
  version: number;
  currentLocation?: keyof Game["locations"];
  previousLocation?: keyof Game["locations"];
  currentInteraction?: string;
  lastInteractionAt?: number;
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
  lists: {
    [K in keyof Game["lists"]]?: Game["lists"][K][];
  };
  inputs: Record<string, unknown>;
};

export type PlayState =
  | "playing"
  | "loading"
  | "pausing"
  | "quitting"
  | "reloading";

export type GameStateManager<Game extends GameWorld> = ReadWritableState<
  GameState<Game>
>;

export type GameSaveStateManager<Game extends GameWorld> = {
  activeState: () => GameStateManager<Game>;
  stableState: () => GameStateManager<Game>;

  /**
   * @deprecated use activeState().get()
   */
  getState: () => GameState<Game>;
  /**
   * @deprecated use activeState().update()
   */
  updateState: (
    mutation: (currentState: GameState<Game>) => GameState<Game>
  ) => void;

  storeInput: (key: string, value: unknown) => void;

  /**
   * @deprecated use stableState().get()
   */
  getSaveState: () => GameState<Game>;

  updateSaveState: () => void;
  restoreSaveState: () => void;

  getPlayState: () => PlayState;
  setPlayState: (state: PlayState) => void;
  isAborting: () => boolean;
};

export type PatchFunction<T> = (state: T) => T;

export type ReadableState<T> = {
  get: () => T;
};

export type WritableState<T> = {
  update: (patch: PatchFunction<T>) => void;
};

export type ReadWritableState<T> = ReadableState<T> & WritableState<T>;

export const createState = <T>(initialState: T): ReadWritableState<T> => {
  let state = initialState;
  return {
    get: () => state,
    update: (patch) => {
      state = patch(state);
    },
  };
};
