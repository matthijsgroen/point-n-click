import { StateObject } from "./state";
import { GameWorld } from "./world";

export type NumberComparator =
  | "equal"
  | "lessThanOrEqual"
  | "lessThan"
  | "moreThan"
  | "moreThanOrEqual";

export type GameObjectCounterCondition<
  Game extends GameWorld,
  ItemType extends StateObject
> = {
  op: "CounterCompare";
  objectType: ItemType;
  item: keyof Game[`${ItemType}s`];
  name: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["counters"];
  comparator: NumberComparator;
  value: number;
};

export type TrueCondition = {
  op: "true";
};

export type FalseCondition = {
  op: "false";
};

export type NegateCondition<Game extends GameWorld> = {
  op: "negate";
  condition: StateCondition<Game>;
};

export type AndCondition<Game extends GameWorld> = {
  op: "and";
  conditions: StateCondition<Game>[];
};

export type OrCondition<Game extends GameWorld> = {
  op: "or";
  conditions: StateCondition<Game>[];
};

export type OverlayOpenCondition<Game extends GameWorld> = {
  op: "OverlayOpen";
  overlay?: keyof Game["overlays"];
};

export type LocationCondition<Game extends GameWorld> = {
  op: "IsLocation";
  location: keyof Game["locations"];
};

export type GameObjectStateCondition<
  Game extends GameWorld,
  ItemType extends StateObject
> = {
  op: "StateEquals";
  objectType: ItemType;
  item: keyof Game[`${ItemType}s`];
  state: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["states"] | "unknown";
};

export type GameObjectFlagCondition<
  Game extends GameWorld,
  ItemType extends StateObject
> = {
  op: "IsFlagSet";
  objectType: ItemType;
  item: keyof Game[`${ItemType}s`];
  flag: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["flags"];
};

export type ListItemCondition<Game extends GameWorld> = {
  op: "IsInList";
  list: keyof Game["lists"];
  item: Game["lists"][keyof Game["lists"]];
};

export type StateCondition<Game extends GameWorld> =
  | GameObjectStateCondition<Game, "character">
  | GameObjectStateCondition<Game, "item">
  | GameObjectStateCondition<Game, "location">
  | GameObjectStateCondition<Game, "overlay">
  | GameObjectFlagCondition<Game, "character">
  | GameObjectFlagCondition<Game, "item">
  | GameObjectFlagCondition<Game, "location">
  | GameObjectCounterCondition<Game, "character">
  | GameObjectCounterCondition<Game, "item">
  | GameObjectCounterCondition<Game, "location">
  | ListItemCondition<Game>
  | OverlayOpenCondition<Game>
  | LocationCondition<Game>
  | TrueCondition
  | FalseCondition
  | NegateCondition<Game>
  | AndCondition<Game>
  | OrCondition<Game>;
