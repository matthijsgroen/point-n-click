import {
  GameObjectFlagCondition,
  GameObjectStateCondition,
  GameObjectValueCondition,
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
  setValue: (flag: Game[`${T}s`][I]["values"], value: number) => void;
  increaseValue: (flag: Game[`${T}s`][I]["values"], value: number) => void;
  decreaseValue: (flag: Game[`${T}s`][I]["values"], value: number) => void;

  hasState: (
    state: Game[`${T}s`][I]["states"] | "unknown"
  ) => GameObjectStateCondition<Game, T>;
  hasFlag: (
    flag: Game[`${T}s`][I]["flags"]
  ) => GameObjectFlagCondition<Game, T>;
  hasValue: (valueName: Game[`${T}s`][I]["values"]) => {
    equals: (value: number) => GameObjectValueCondition<Game, T>;
    lessThan: (value: number) => GameObjectValueCondition<Game, T>;
    lessThanEquals: (value: number) => GameObjectValueCondition<Game, T>;
    moreThan: (value: number) => GameObjectValueCondition<Game, T>;
    moreThanEquals: (value: number) => GameObjectValueCondition<Game, T>;
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
      statementType: `UpdateGameObjectFlag`,
      objectType,
      stateItem: item,
      flag,
      value,
    });
  },
  setValue: (name, value) => {
    addToActiveScript({
      statementType: `UpdateGameObjectValue`,
      objectType,
      stateItem: item,
      name,
      transactionType: "set",
      value,
    });
  },
  increaseValue: (name, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectValue",
      objectType,
      stateItem: item,
      transactionType: "increase",
      name,
      value,
    });
  },
  decreaseValue: (name, value) => {
    addToActiveScript({
      statementType: "UpdateGameObjectValue",
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
  hasValue: (valueName) => ({
    equals: (value) => ({
      op: "ValueCompare",
      comparator: "equal",
      objectType,
      item,
      name: valueName,
      value,
    }),
    lessThan: (value) => ({
      op: "ValueCompare",
      comparator: "lessThan",
      objectType,
      item,
      name: valueName,
      value,
    }),
    lessThanEquals: (value) => ({
      op: "ValueCompare",
      comparator: "lessThanOrEqual",
      objectType,
      item,
      name: valueName,
      value,
    }),
    moreThan: (value) => ({
      op: "ValueCompare",
      comparator: "moreThan",
      objectType,
      item,
      name: valueName,
      value,
    }),
    moreThanEquals: (value) => ({
      op: "ValueCompare",
      comparator: "moreThanOrEqual",
      objectType,
      item,
      name: valueName,
      value,
    }),
  }),
});
