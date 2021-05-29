import { MaybePromise } from "../types/generic";

export interface QueueItem {
  type: string;
}

export interface QueueProcessor<T extends QueueItem> {
  type: string;
  handle(item: T): MaybePromise<void>;
  preload?(item: T): MaybePromise<void>;
}

export type Queue = {
  length: number;
  addItem(item: QueueItem): void;
  addProcessor<T extends QueueItem>(handler: QueueProcessor<T>): void;
  processItem(): Promise<void>;
};

type QueuePointer = {
  index: number;
};

const queue = (): Queue => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];

  const pointer: QueuePointer = { index: 0 };
  // foo

  return {
    get length() {
      return items.length;
    },
    addItem(item) {
      items.push(item);
    },
    addProcessor(handler) {
      processors.push(handler);
    },
    async processItem() {
      const activeItem = items[pointer.index];
      if (activeItem) {
        const processor = processors.find((e) => e.type === activeItem.type);
        await processor?.handle(activeItem);
        pointer.index++;
      }
    },
  };
};

export default queue;
