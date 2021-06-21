import { Store } from "@reduxjs/toolkit";
import { Action, Slice, SliceCaseReducers } from "@reduxjs/toolkit";
import { Queue, QueueProcessor } from "../queue";

export const stateHelpers = <
  GameState,
  Reducers extends SliceCaseReducers<GameState>,
  Name extends string
>(
  slice: Slice<GameState, Reducers, Name>,
  q: Queue
) => {
  return {
    onState(
      condition: (state: GameState) => boolean,
      whenTrue: () => void,
      whenFalse?: () => void
    ) {
      q.addItem({
        type: "gameState",
        flowType: "choice",
        condition,
        whenTrue,
        whenFalse,
      });
    },
    updateState: (getAction: (actions: typeof slice.actions) => Action) => {
      q.addItem({
        type: "gameState",
        flowType: "update",
        action: getAction(slice.actions),
      });
    },
  };
};

export type StateEvent<T> = StateCheckEvent<T> | UpdateStateEvent;

export type StateCheckEvent<T> = {
  type: "gameState";
  flowType: "choice";
  condition: (state: T) => boolean;
  whenTrue: () => void;
  whenFalse: () => void;
};

export type UpdateStateEvent = {
  type: "gameState";
  flowType: "update";
  action: Action<any>;
};

export const stateSystem = <
  State extends { gameState: GameState },
  EngineState extends Store<State, Action<any>>,
  GameState
>(
  store: EngineState
) => {
  const processor: QueueProcessor<StateEvent<GameState>> = {
    type: "gameState",
    handle: (item, _bus, { startSubQueue }) => {
      if (item.flowType === "choice") {
        const gameState = store.getState().gameState;
        const test = item.condition(gameState);

        const endSubQueue = startSubQueue();
        if (test) {
          item.whenTrue();
        } else {
          item.whenFalse && item.whenFalse();
        }
        endSubQueue();
      }
      if (item.flowType === "update") {
        store.dispatch(item.action);
      }
    },
  };
  return {
    processor,
  };
};
