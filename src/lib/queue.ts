import { MaybePromise } from "../types/generic";
import { MessageBus } from "./messageBus";

export interface QueueItem {
  type: string;
}

export type QueueHelpers = {
  startSubQueue: () => () => void;
};

export interface QueueProcessor<T extends QueueItem> {
  type: T["type"];
  handle(item: T, bus: MessageBus, helpers: QueueHelpers): MaybePromise<void>;
  preload?(item: T): MaybePromise<void>;
}

const queue = (bus: MessageBus) => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];
  let activeQueue = items;
  let stepsProcessed = 0;

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
        await processor.handle(item, bus, { startSubQueue });
      }
    },
  };
};

export type Queue = ReturnType<typeof queue>;

export default queue;
