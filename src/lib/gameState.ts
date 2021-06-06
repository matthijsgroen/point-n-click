import { QueueProcessor } from "./queue";

export type StateEvent<T> = {
  type: "gameState";
  flowType: "choice";
  condition: (state: T) => boolean;
  whenTrue: () => void;
  whenFalse: () => void;
};

export const stateSystem = <T>(state: T) => {
  let gameState = state;

  const stateProcessor: QueueProcessor<StateEvent<T>> = {
    type: "gameState",
    handle: (item, _bus, { startSubQueue }) => {
      if (item.flowType === "choice") {
        const test = item.condition(gameState);
        const endSubQueue = startSubQueue();
        test ? item.whenTrue() : item.whenFalse();
        endSubQueue();
      }
    },
  };
  return {
    stateProcessor,
  };
};
