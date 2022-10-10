import { NumberComparator, StateCondition } from "../../dsl/ast-types";
import { GameStateManager } from "./types";
import { GameWorld } from "../../dsl/world-types";

const numberCompare = (
  a: number,
  compare: NumberComparator,
  b: number
): boolean => {
  switch (compare) {
    case "equal":
      return a === b;
    case "lessThan":
      return a < b;
    case "lessThanOrEqual":
      return a <= b;
    case "moreThan":
      return a > b;
    case "moreThanOrEqual":
      return a >= b;
  }
};

export const testCondition = <Game extends GameWorld>(
  condition: StateCondition<Game>,
  stateManager: GameStateManager<Game>
): boolean => {
  if (condition.op === "true") {
    return true;
  }
  if (condition.op === "false") {
    return false;
  }
  if (condition.op === "negate") {
    return !testCondition(condition.condition, stateManager);
  }
  if (condition.op === "itemEquals") {
    const item = condition.item;
    const expectedState = condition.state;
    const actualState = stateManager.getState().items[item]?.state ?? "unknown";
    return expectedState === actualState;
  }
  if (condition.op === "characterEquals") {
    const item = condition.item;
    const expectedState = condition.state;
    const actualState =
      stateManager.getState().characters[item]?.state ?? "unknown";
    return expectedState === actualState;
  }
  if (condition.op === "locationEquals") {
    const item = condition.item;
    const expectedState = condition.state;
    const actualState =
      stateManager.getState().locations[item]?.state ?? "unknown";
    return expectedState === actualState;
  }
  if (condition.op === "characterFlagSet") {
    return (
      stateManager.getState().characters[condition.item]?.flags[
        String(condition.flag)
      ] === true
    );
  }
  if (condition.op === "locationFlagSet") {
    return (
      stateManager.getState().locations[condition.item]?.flags[
        String(condition.flag)
      ] === true
    );
  }
  if (condition.op === "itemFlagSet") {
    return (
      stateManager.getState().items[condition.item]?.flags[
        String(condition.flag)
      ] === true
    );
  }
  if (condition.op === "characterValueCompare") {
    const comp = condition.comparator;
    const stateValue =
      stateManager.getState().characters[condition.item].values[
        String(condition.name)
      ] ?? 0;
    return numberCompare(stateValue, comp, condition.value);
  }
  if (condition.op === "locationValueCompare") {
    const comp = condition.comparator;
    const stateValue =
      stateManager.getState().locations[condition.item].values[
        String(condition.name)
      ] ?? 0;
    return numberCompare(stateValue, comp, condition.value);
  }
  if (condition.op === "itemValueCompare") {
    const comp = condition.comparator;
    const stateItem = stateManager.getState().items[condition.item];
    const stateValue = stateItem
      ? stateItem.values[String(condition.name)] ?? 0
      : 0;
    return numberCompare(stateValue, comp, condition.value);
  }
  if (condition.op === "and") {
    return condition.conditions.every((condition) =>
      testCondition(condition, stateManager)
    );
  }
  if (condition.op === "or") {
    return condition.conditions.some((condition) =>
      testCondition(condition, stateManager)
    );
  }

  return true;
};
