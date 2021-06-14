import { MaybePromise } from "../types/generic";
import messageBus, { MessageBus } from "./messageBus";

export interface QueueItem {
  type: string;
}

export type QueueHelpers = {
  startSubQueue: () => () => void;
};

export interface QueueProcessor<T extends QueueItem> {
  type: T["type"];
  handle(
    item: T,
    channel: { request: MessageBus["request"]; trigger: MessageBus["trigger"] },
    helpers: QueueHelpers
  ): MaybePromise<void>;
  preload?(item: T): MaybePromise<void>;
}

type ProcessLogItem<
  Q extends QueueItem = QueueItem,
  Payload extends unknown = any,
  Response extends unknown = any
> = {
  type: string;
  payload: Payload;
  queueItem: Q;
  result?: Response;
  direction: "request" | "response";
};

const queue = (bus: MessageBus) => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];
  let activeQueue = items;
  let stepsProcessed = 0;
  const processLog: ProcessLogItem[] = [];

  const startSubQueue = () => {
    const queue: QueueItem[] = [];
    const prevQueue = activeQueue;
    activeQueue = queue;

    return () => {
      activeQueue = queue.concat(prevQueue);
    };
  };

  return {
    get length() {
      return activeQueue.length;
    },
    get itemsProcessed() {
      return stepsProcessed;
    },
    get processLog() {
      return processLog;
    },
    addItem<T extends QueueItem>(item: T) {
      activeQueue.push(item);
    },
    addProcessor<T extends QueueItem>(handler: QueueProcessor<T>) {
      processors.push(handler);
    },
    async processItem() {
      stepsProcessed++;
      const item = activeQueue.shift();
      const processor = processors.find((p) => p.type === item?.type);
      if (processor && item) {
        const request: MessageBus["request"] = async <T, R>(
          message: string,
          data: T
        ): Promise<R> => {
          processLog.push({
            type: message,
            payload: data,
            queueItem: item,
            direction: "request",
          });
          const result: R = await bus.request(message, {
            queueItem: item,
            message: data,
          });
          processLog.push({
            type: message,
            payload: data,
            result,
            queueItem: item,
            direction: "response",
          });

          return result;
        };
        await processor.handle(
          item,
          { request, trigger: bus.trigger },
          { startSubQueue }
        );
      }
    },
  };
};

export type Queue = ReturnType<typeof queue>;

export default queue;
