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

const NO_DATA = Symbol("No Data");

const queue = (bus: MessageBus) => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];
  let activeQueue = items;
  let stepsProcessed = 0;
  const processLog: ProcessLogItem[] = [];
  let processReplay: ProcessLogItem[] = [];

  const startSubQueue = () => {
    const queue: QueueItem[] = [];
    const prevQueue = activeQueue;
    activeQueue = queue;

    return () => {
      activeQueue = queue.concat(prevQueue);
    };
  };

  const responseNextInReplayLog = <R>(
    request: ProcessLogItem
  ): R | typeof NO_DATA => {
    const serializedRequest = JSON.stringify(request);
    const itemIndex = processReplay.findIndex(
      (e) => JSON.stringify(e) === serializedRequest
    );
    const potentialReply = processReplay[itemIndex + 1];
    if (!potentialReply) return NO_DATA;
    if (
      potentialReply.direction === "response" &&
      JSON.stringify(potentialReply.queueItem) ===
        JSON.stringify(request.queueItem) &&
      JSON.stringify(potentialReply.payload) === JSON.stringify(request.payload)
    ) {
      processLog.push(potentialReply);
      processReplay.splice(itemIndex, 2);
      return potentialReply.result as R;
    }
    return NO_DATA;
  };

  const processItem = async () => {
    stepsProcessed++;
    const item = activeQueue.shift();

    const processor = processors.find((p) => p.type === item?.type);
    if (processor && item) {
      const request: MessageBus["request"] = async <T, R>(
        message: string,
        data: T
      ): Promise<R> => {
        const requestItem: ProcessLogItem<typeof item, T> = {
          type: message,
          payload: data,
          queueItem: item,
          direction: "request",
        };

        processLog.push(requestItem);
        const resultFromReplay = responseNextInReplayLog<R>(requestItem);

        if (resultFromReplay !== NO_DATA) {
          return Promise.resolve(resultFromReplay);
        } else {
          const result: R = await bus.request(message, data);
          processLog.push({
            type: message,
            payload: data,
            result,
            queueItem: item,
            direction: "response",
          });
          return result;
        }
      };
      await processor.handle(
        item,
        { request, trigger: bus.trigger },
        { startSubQueue }
      );
    }
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
    processItem,
    async replay(log: ProcessLogItem[]) {
      processReplay = log;

      let processed: number;

      do {
        processed = stepsProcessed;
        await processItem();
      } while (stepsProcessed > processed && processReplay.length > 0);
    },
  };
};

export type Queue = ReturnType<typeof queue>;

export default queue;
