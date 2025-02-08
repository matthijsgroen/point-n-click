import { GameWorld } from "../types/world";

export type StateObject = "item" | "location" | "character" | "overlay";

export type ObjectStateHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  [Flag in Exclude<Game[`${T}s`][Item]["flags"], undefined>]: boolean;
} & {
  [Counter in Exclude<Game[`${T}s`][Item]["counters"], undefined>]: number;
} & {
  name: string;
  state: Game[`${T}s`][Item]["states"] | "unknown";
};

export type ObjectReadStateHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  readonly [Flag in Exclude<Game[`${T}s`][Item]["flags"], undefined>]: boolean;
} & {
  readonly [Counter in Exclude<
    Game[`${T}s`][Item]["counters"],
    undefined
  >]: number;
} & {
  readonly name: string;
  readonly state: Game[`${T}s`][Item]["states"] | "unknown";
};

export type CharactersHelper<Game extends GameWorld> = {
  [K in keyof Game["characters"]]: ObjectStateHelper<Game, "character", K> & {
    readonly say: (...sentences: string[]) => void;
  };
};

export type ItemsHelper<Game extends GameWorld> = {
  [K in keyof Game["items"]]: ObjectStateHelper<Game, "item", K>;
};

export type LocationsHelper<Game extends GameWorld> = {
  [K in keyof Game["locations"]]: ObjectStateHelper<Game, "location", K> & {
    readonly travel: () => void;
  };
};

export type ListsHelper<Game extends GameWorld> = {
  [K in keyof Game["lists"]]: {
    readonly addUnique: (item: Game["lists"][K]) => void;
    readonly has: (item: Game["lists"][K]) => boolean;
  };
};

export type ScriptHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  readonly characters: CharactersHelper<Game>;
  readonly items: ItemsHelper<Game>;
  readonly locations: LocationsHelper<Game>;
  readonly lists: ListsHelper<Game>;
  readonly text: (...sentences: string[]) => void;
} & ObjectStateHelper<Game, T, Item>;

export type NewScript<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = (worldHelper: ScriptHelper<Game, T, Item>) => void;

export type ReadStateHelper<Game extends GameWorld, T extends StateObject> = {
  [K in keyof Game[`${T}s`]]: ObjectReadStateHelper<Game, T, K>;
};

export type ReadListHelper<Game extends GameWorld> = {
  [K in keyof Game["lists"]]: {
    readonly has: (item: Game["lists"][K]) => boolean;
  };
};

export type GameState<Game extends GameWorld> = {
  readonly characters: ReadStateHelper<Game, "character">;
  readonly locations: ReadStateHelper<Game, "location">;
  readonly overlays: ReadStateHelper<Game, "overlay">;
  readonly items: ReadStateHelper<Game, "item">;
  readonly lists: ReadListHelper<Game>;
};

export type Interactions<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = (
  state: GameState<Game> & ObjectReadStateHelper<Game, T, Item>,
  action: (
    name: string,
    condition: boolean,
    action: NewScript<Game, T, Item>
  ) => void
) => void;

export type OverlayObject<
  Game extends GameWorld,
  Overlay extends keyof Game["overlays"]
> = {
  prompt?: string;
  onEnter?: NewScript<Game, "overlay", Overlay>;
  onLeave?: NewScript<Game, "overlay", Overlay>;
  interactions?: Interactions<Game, "overlay", Overlay>;
};
