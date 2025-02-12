import { RecursivePartial } from "../types/utils";
import { GameWorld, StateObject } from "../types/world";

export type ObjectState<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  [Flag in Exclude<Game[`${T}s`][Item]["flags"], undefined>]: boolean;
} & {
  [Counter in Exclude<Game[`${T}s`][Item]["counters"], undefined>]: number;
} & {
  state: Game[`${T}s`][Item]["states"] | "unknown";
};

export type ObjectGroupState<
  Game extends GameWorld,
  T extends StateObject,
  Mixin = unknown
> = {
  [K in keyof Game[`${T}s`]]: ObjectState<Game, T, K> & Mixin;
};

export type PartialObjectGroupState<
  Game extends GameWorld,
  T extends StateObject,
  Mixin = unknown
> = {
  [K in keyof Game[`${T}s`]]: RecursivePartial<ObjectState<Game, T, K>> & Mixin;
};

export type InitialListHelper<Game extends GameWorld> = {
  [K in keyof Game["lists"]]: {
    items: Game["lists"][K][];
  };
};

export type GameState<Game extends GameWorld> = {
  version: Game["version"];
  currentLocation: keyof Game["locations"];
  previousLocation?: keyof Game["locations"];
  currentInteraction?: string;
  lastInteractionAt?: number;
  overlayStack?: (keyof Game["overlays"])[];
  currentOverlay?: keyof Game["overlays"];
  currentScene?: Game["scenes"];

  readonly characters: PartialObjectGroupState<
    Game,
    "character",
    { name: string }
  >;
  readonly locations: PartialObjectGroupState<
    Game,
    "location",
    { name: string }
  >;
  readonly overlays?: RecursivePartial<ObjectGroupState<Game, "overlay">>;
  readonly items?: RecursivePartial<
    ObjectGroupState<Game, "item", { name?: string }>
  >;
  readonly lists?: RecursivePartial<InitialListHelper<Game>>;
};
