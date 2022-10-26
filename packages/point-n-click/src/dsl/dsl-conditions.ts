import {
  AndCondition,
  FalseCondition,
  GameWorld,
  NegateCondition,
  OrCondition,
  StateCondition,
  TrueCondition,
  OverlayOpenCondition,
} from "@point-n-click/types";

const always = (): TrueCondition => ({ op: "true" });
const never = (): FalseCondition => ({ op: "false" });

export type ConditionSet<Game extends GameWorld> = {
  not: (condition: StateCondition<Game>) => NegateCondition<Game>;
  and: (...conditions: StateCondition<Game>[]) => AndCondition<Game>;
  or: (...conditions: StateCondition<Game>[]) => OrCondition<Game>;
  always: () => TrueCondition;
  never: () => FalseCondition;
  isOverlayOpen: (
    overlay?: keyof Game["overlays"]
  ) => OverlayOpenCondition<Game>;
};

export const dslStateConditions = <
  Game extends GameWorld
>(): ConditionSet<Game> => {
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

  const isOverlayOpen = (
    overlay?: keyof Game["overlays"]
  ): OverlayOpenCondition<Game> => ({
    op: "OverlayOpen",
    overlay,
  });

  return {
    not,
    and,
    or,
    always,
    never,
    isOverlayOpen,
  };
};
