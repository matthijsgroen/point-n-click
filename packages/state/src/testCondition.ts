import {
  GameWorld,
  NumberComparator,
  StateCondition,
  GameStateManager,
} from "@point-n-click/types";

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

const getCounters = (item: unknown): { [key: string]: number } => {
  if (typeof item === "object" && item !== null && "counters" in item) {
    return item.counters as { [key: string]: number };
  }
  return {};
};

const getFlags = (item: unknown): { [key: string]: boolean } => {
  if (typeof item === "object" && item !== null && "flags" in item) {
    return item.flags as { [key: string]: boolean };
  }
  return {};
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
  if (condition.op === "StateEquals") {
    const item = condition.item;
    const expectedState = condition.state;
    const actualState =
      stateManager.getState()[`${condition.objectType}s`][item]?.state ??
      "unknown";
    return expectedState === actualState;
  }
  if (condition.op === "IsFlagSet") {
    const item =
      stateManager.getState()[`${condition.objectType}s`][condition.item];
    const flags = getFlags(item);
    return flags[String(condition.flag)] === true;
  }
  if (condition.op === "CounterCompare") {
    const comp = condition.comparator;
    const item =
      stateManager.getState()[`${condition.objectType}s`][condition.item];
    const counters = getCounters(item);
    const stateValue = counters[String(condition.name)] ?? 0;
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
  if (condition.op === "OverlayOpen") {
    const openOverlays = stateManager.getState().overlayStack;
    if (condition.overlay) {
      return openOverlays.some((overlay) => overlay === condition.overlay);
    } else {
      return openOverlays.length > 0;
    }
  }
  if (condition.op === "IsLocation") {
    return stateManager.getState().currentLocation === condition.location;
  }

  return true;
};
