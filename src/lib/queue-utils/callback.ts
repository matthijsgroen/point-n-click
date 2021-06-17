import { MessageBus } from "../messageBus";
import { Queue, QueueHelpers, QueueProcessor } from "../queue";

export const callback = (
  q: Queue,
  cb: (
    channel: { request: MessageBus["request"]; trigger: MessageBus["trigger"] },
    helpers: QueueHelpers
  ) => void
) => {
  q.addItem({
    type: "callback",
    cb,
  });
};

export const callbackProcessor: QueueProcessor<{
  type: "callback";
  cb: (
    channel: { request: MessageBus["request"]; trigger: MessageBus["trigger"] },
    helpers: QueueHelpers
  ) => void;
}> = {
  type: "callback",
  handle: async (item, channel, helpers) => {
    // const endSubQueue = startSubQueue();
    await item.cb(channel, helpers);
    // endSubQueue();
  },
};
