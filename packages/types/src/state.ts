import { GameWorld } from "./world";

export type StateObject = "item" | "location" | "character";

export type GameState<Game extends GameWorld> = {
  currentLocation: keyof Game["locations"];
  previousLocation?: keyof Game["locations"];
  currentInteraction?: string;
  overlayStack: Game["overlays"][];
  currentOverlay?: Game["overlays"];
  settings: {
    cpm: number;
    skipMode: "tillChoice" | "screen" | "off";
  };
  items: {
    [K in keyof Game["items"]]?: {
      state: Game["items"][K]["states"] | "unknown";
      flags: Record<string, boolean>;
      counters: Record<string, number>;
    };
  };
  characters: {
    [K in keyof Game["characters"]]: {
      state: Game["characters"][K]["states"] | "unknown";
      flags: Record<string, boolean>;
      counters: Record<string, number>;
      name: string | null;
      defaultName: string;
    };
  };
  locations: {
    [K in keyof Game["locations"]]: {
      state: Game["locations"][K]["states"] | "unknown";
      flags: Record<string, boolean>;
      counters: Record<string, number>;
    };
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
