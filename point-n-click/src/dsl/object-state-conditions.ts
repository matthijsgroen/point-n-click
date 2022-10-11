import {
  GameObjectFlagCondition,
  GameObjectStateCondition,
  GameObjectCounterCondition,
  ScriptStatement,
  StateObject,
} from "./ast-types";
import { GameWorld } from "./world-types";

export type ObjectStateDSL<
  Game extends GameWorld,
  T extends StateObject,
  I extends keyof Game[`${T}s`]
> = {
  setState: (newState: Game[`${T}s`][I]["states"] | "unknown") => void;
  setFlag: (flag: Game[`${T}s`][I]["flags"], value: boolean) => void;
  setCounter: (flag: Game[`${T}s`][I]["counters"], value: number) => void;
  increaseCounter: (flag: Game[`${T}s`][I]["counters"], value: number) => void;
  decreaseCounter: (flag: Game[`${T}s`][I]["counters"], value: number) => void;

  hasState: (
    state: Game[`${T}s`][I]["states"] | "unknown"
  ) => GameObjectStateCondition<Game, T>;
  hasFlag: (
    flag: Game[`${T}s`][I]["flags"]
  ) => GameObjectFlagCondition<Game, T>;
  hasCounter: (counterName: Game[`${T}s`][I]["counters"]) => {
    equals: (value: number) => GameObjectCounterCondition<Game, T>;
    lessThan: (value: number) => GameObjectCounterCondition<Game, T>;
    lessThanEquals: (value: number) => GameObjectCounterCondition<Game, T>;
    moreThan: (value: number) => GameObjectCounterCondition<Game, T>;
    moreThanEquals: (value: number) => GameObjectCounterCondition<Game, T>;
  };
};

export const objectStateManagement = <
  Game extends GameWorld,
  T extends StateObject,
  I extends keyof Game[`${T}s`]
>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void,
  objectType: T,
  item: I
): ObjectStateDSL<Game, T, I> => ({
  setState: (newState) => {
    addToActiveScript({
      statementType: "UpdateGameObjectState",
      objectType,
      stateItem: item,
      newState,
    });
  },
  setFlag: (flag, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectFlag",
      objectType,
      stateItem: item,
      flag,
      value,
    });
  },
  setCounter: (name, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectCounter",
      objectType,
      stateItem: item,
      name,
      transactionType: "set",
      value,
    });
  },
  increaseCounter: (name, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectCounter",
      objectType,
      stateItem: item,
      transactionType: "increase",
      name,
      value,
    });
  },
  decreaseCounter: (name, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectCounter",
      objectType,
      stateItem: item,
      transactionType: "decrease",
      name,
      value,
    });
  },
  hasState: (state) => ({
    op: "StateEquals",
    objectType,
    item,
    state,
  }),
  hasFlag: (flag) => ({
    op: "IsFlagSet",
    objectType,
    item,
    flag,
  }),
  hasCounter: (valueName) => ({
    equals: (value) => ({
      op: "CounterCompare",
      comparator: "equal",
      objectType,
      item,
      name: valueName,
      value,
    }),
    lessThan: (value) => ({
      op: "CounterCompare",
      comparator: "lessThan",
      objectType,
      item,
      name: valueName,
      value,
    }),
    lessThanEquals: (value) => ({
      op: "CounterCompare",
      comparator: "lessThanOrEqual",
      objectType,
      item,
      name: valueName,
      value,
    }),
    moreThan: (value) => ({
      op: "CounterCompare",
      comparator: "moreThan",
      objectType,
      item,
      name: valueName,
      value,
    }),
    moreThanEquals: (value) => ({
      op: "CounterCompare",
      comparator: "moreThanOrEqual",
      objectType,
      item,
      name: valueName,
      value,
    }),
  }),
});
