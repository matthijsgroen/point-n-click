import { MaybePromise } from "../types/generic";
import hash from "./hash";
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

export type ProcessLogItem<
  Payload extends unknown = any,
  Response extends unknown = any
> = ProcessLogQueueItem | ProcessLogBusItem<Payload, Response>;

export type ProcessLogQueueItem = {
  type: "queueItem";
  queueItem: { type: string; hash: string };
};

export type ProcessLogBusItem<
  Payload extends unknown = any,
  Response extends unknown = any
> = {
  type: "busItem";
  message: string;
  payload: Payload;
  queueItem: { type: string; hash: string };
  result?: Response;
  direction: "request" | "response";
};

enum ResponseType {
  NoResponse,
  Response,
  ResponseLater,
}

type ReplayData<R> = {
  type: ResponseType.Response;
  data: R;
};

type ReplayDataLater<R> = {
  type: ResponseType.ResponseLater;
  data: R;
  item: ProcessLogItem;
};

type ReplayNoData = {
  type: ResponseType.NoResponse;
};

type ReplayResponse<R> = ReplayData<R> | ReplayDataLater<R> | ReplayNoData;

const queue = (bus: MessageBus) => {
  const processors: QueueProcessor<QueueItem>[] = [];
  const items: QueueItem[] = [];
  let activeQueue = items;
  let stepsProcessed = 0;
  const processLog: ProcessLogItem[] = [];
  let processReplay: ProcessLogItem[] = [];
  let waitingForItems: (() => void)[] = [];
  const waitingForReplayResponse: {
    resolver: () => void;
    item: ProcessLogItem;
  }[] = [];

  const checkForResponses = () => {
    const response = processReplay[0];
    if (
      response &&
      response.type === "busItem" &&
      response.direction === "response"
    ) {
      const replyIndex = waitingForReplayResponse.findIndex(
        (e) => e.item === response
      );
      if (replyIndex !== -1) {
        const reply = waitingForReplayResponse[replyIndex];
        reply.resolver();
        waitingForReplayResponse.splice(replyIndex, 1);
        processReplay.shift();

        checkForResponses();
      }
    }
  };

  const startSubQueue = () => {
    const queue: QueueItem[] = [];
    const prevQueue = activeQueue;
    activeQueue = queue;

    return () => {
      activeQueue = prevQueue;
      queue.reverse().forEach((e) => activeQueue.unshift(e));
      if (activeQueue === items) {
        waitingForItems.forEach((call) => call());
        waitingForItems = [];
      }
    };
  };

  const getResponseIndex = (request: ProcessLogBusItem): number | undefined =>
    processReplay.findIndex(
      (potentialReply) =>
        potentialReply.type === "busItem" &&
        potentialReply.direction === "response" &&
        JSON.stringify(potentialReply.queueItem) ===
          JSON.stringify(request.queueItem) &&
        JSON.stringify(potentialReply.payload) ===
          JSON.stringify(request.payload)
    );

  const responseNextInReplayLog = <R>(
    request: ProcessLogBusItem
  ): ReplayResponse<R> => {
    const serializedRequest = JSON.stringify(request);
    const itemIndex = processReplay.findIndex(
      (e) => JSON.stringify(e) === serializedRequest
    );
    const responseIndex = getResponseIndex(request);

    if (responseIndex === itemIndex + 1) {
      const result = (processReplay[responseIndex] as ProcessLogBusItem)
        .result as R;
      processReplay.splice(0, responseIndex + 1);
      return {
        data: result,
        type: ResponseType.Response,
      };
    }
    if (responseIndex !== undefined && responseIndex > itemIndex + 1) {
      const item = processReplay[responseIndex] as ProcessLogBusItem;
      processReplay.splice(itemIndex, 1);
      return {
        data: item.result,
        item,
        type: ResponseType.ResponseLater,
      };
    }
    return { type: ResponseType.NoResponse };
  };

  const processItem = async () => {
    const item = activeQueue.shift();

    const processor = processors.find((p) => p.type === item?.type);
    if (processor && item) {
      const request: MessageBus["request"] = async <T, R>(
        message: string,
        payload: T
      ): Promise<R> => {
        const requestItem: ProcessLogItem<T> = {
          type: "busItem",
          message,
          payload,
          queueItem: { type: item.type, hash: hash(item) },
          direction: "request",
        };

        processLog.push(requestItem);
        const resultFromReplay = responseNextInReplayLog<R>(requestItem);
        checkForResponses();

        // console.log(
        //   {
        //     [ResponseType.NoResponse]: "No Response",
        //     [ResponseType.Response]: "Response",
        //     [ResponseType.ResponseLater]: "Later",
        //   }[resultFromReplay.type]
        // );

        // if (processLog.length > 0 && resultFromReplay.type === ResponseType.NoResponse ) {
        //   return false
        // }

        switch (resultFromReplay.type) {
          case ResponseType.NoResponse:
            const result: R = await bus.request(message, payload);
            processLog.push({
              type: "busItem",
              message,
              payload,
              result,
              queueItem: { type: item.type, hash: hash(item) },
              direction: "response",
            });
            return result;
          case ResponseType.Response:
            return Promise.resolve(resultFromReplay.data);
          case ResponseType.ResponseLater:
            return new Promise((resolve) => {
              waitingForReplayResponse.push({
                resolver: () => {
                  processLog.push({
                    type: "busItem",
                    message,
                    payload,
                    result: resultFromReplay.data,
                    queueItem: { type: item.type, hash: hash(item) },
                    direction: "response",
                  });
                  resolve(resultFromReplay.data);
                },
                item: resultFromReplay.item,
              });
            });
        }
      };

      stepsProcessed++;

      await processor.handle(
        item,
        { request, trigger: bus.trigger },
        { startSubQueue }
      );
      return true;
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
      if (activeQueue === items) {
        waitingForItems.forEach((call) => call());
        waitingForItems = [];
      }
    },
    addProcessor<T extends QueueItem>(handler: QueueProcessor<T>) {
      processors.push(handler);
    },
    processItem,
    async waitForItem() {
      if (activeQueue[0] !== undefined) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        waitingForItems.push(resolve);
      });
    },
    async replay(log: ProcessLogItem[]): Promise<boolean> {
      processReplay = log;

      let processed: number;
      do {
        processed = stepsProcessed;
        await processItem();

        console.log(activeQueue[0]);
      } while (stepsProcessed > processed && processReplay.length > 0);

      console.log(stepsProcessed, processed, processReplay.length);

      return true;
    },
  };
};

export type Queue = ReturnType<typeof queue>;

export default queue;
