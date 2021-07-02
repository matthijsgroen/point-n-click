import { Action, Store } from "@reduxjs/toolkit";
import { MessageBus } from "../messageBus";
import { Queue, QueueHelpers, QueueProcessor } from "../queue";

export const callback = <GameState>(
  q: Queue,
  cb: (
    channel: {
      request: MessageBus["request"];
      trigger: MessageBus["trigger"];
      store: Store<{ gameState: GameState }, Action<any>>;
    },
    helpers: QueueHelpers
  ) => void
) => {
  q.addItem({
    type: "callback",
    cb,
  });
};

export const callbackSystem = <
  State extends { gameState: GameState },
  EngineState extends Store<State, Action<any>>,
  GameState
>(
  store: EngineState
) => {
  const processor: QueueProcessor<{
    type: "callback";
    cb: (
      channel: {
        request: MessageBus["request"];
        trigger: MessageBus["trigger"];
        store: EngineState;
      },
      helpers: QueueHelpers
    ) => void;
  }> = {
    type: "callback",
    handle: async (item, channel, helpers) =>
      item.cb({ ...channel, store }, helpers),
  };

  return { processor };
};
