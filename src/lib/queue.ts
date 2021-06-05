import { MaybePromise } from "../types/generic";
import { MessageBus } from "./messageBus";

export interface QueueItem {
  type: string;
}

export interface QueueProcessor<T extends QueueItem> {
  type: T["type"];
  handle(item: T, bus: MessageBus): MaybePromise<void>;
  preload?(item: T): MaybePromise<void>;
}

const queue = (bus: MessageBus) => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];

  return {
    get length() {
      return items.length;
    },
    addItem<T extends QueueItem>(item: T) {
      items.push(item);
    },
    addProcessor<T extends QueueItem>(handler: QueueProcessor<T>) {
      processors.push(handler);
    },
    async processItem() {
      const item = items.shift();
      const processor = processors.find((p) => p.type === item?.type);
      if (processor && item) {
        await processor.handle(item, bus);
      }
    },
  };
};

export type Queue = ReturnType<typeof queue>;

export default queue;
