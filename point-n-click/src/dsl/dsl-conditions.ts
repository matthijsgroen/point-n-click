import {
  TrueCondition,
  FalseCondition,
  StateCondition,
  NegateCondition,
  AndCondition,
  OrCondition,
  GameObjectStateCondition,
  GameObjectFlagCondition,
  NumberComparator,
  GameObjectValueCondition,
} from "./ast-types";
import { GameWorld } from "./world-types";

const always = (): TrueCondition => ({ op: "true" });
const never = (): FalseCondition => ({ op: "false" });

export const dslStateConditions = <Game extends GameWorld>() => {
  const not = (condition: StateCondition<Game>): NegateCondition<Game> => ({
    op: "negate",
    condition,
  });
  const and = (...conditions: StateCondition<Game>[]): AndCondition<Game> => ({
    op: "and",
    conditions,
  });
  const or = (...conditions: StateCondition<Game>[]): OrCondition<Game> => ({
    op: "or",
    conditions,
  });
  const isState =
    <I extends "item" | "character" | "location">(key: I) =>
    <K extends keyof Game[`${I}s`]>(
      item: K,
      state: Game[`${I}s`][K]["states"] | "unknown"
    ): GameObjectStateCondition<Game, I> => ({
      op: `${key}Equals`,
      item,
      state,
    });
  const hasFlag =
    <I extends "item" | "character" | "location">(key: I) =>
    <K extends keyof Game[`${I}s`]>(
      item: K,
      flag: Game[`${I}s`][K]["flags"]
    ): GameObjectFlagCondition<Game, I> => ({
      op: `${key}FlagSet`,
      item,
      flag,
    });
  const hasValue =
    <I extends "item" | "character" | "location">(key: I) =>
    <K extends keyof Game[`${I}s`]>(
      item: K,
      name: Game[`${I}s`][K]["values"],
      comparator: NumberComparator,
      value: number
    ): GameObjectValueCondition<Game, I> => ({
      op: `${key}ValueCompare`,
      item,
      name,
      comparator,
      value,
    });

  return {
    isItemState: isState("item"),
    isLocationState: isState("location"),
    isCharacterState: isState("character"),
    hasCharacterFlag: hasFlag("character"),
    hasLocationFlag: hasFlag("location"),
    hasItemFlag: hasFlag("item"),
    hasCharacterValue: hasValue("character"),
    hasLocationValue: hasValue("location"),
    hasItemValue: hasValue("item"),
    not,
    and,
    or,
    always,
    never,
  };
};
