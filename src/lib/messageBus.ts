import { MaybePromise } from "../types/generic";

export interface Event {
  type: string;
}

export type Reply<T extends unknown = any> = (data: T) => void;
export type Listener = (event: Event) => void;
export type Responder<T = any, K = any> = (reply: Reply<T>, payload: K) => void;

const matchPattern = (pattern: string, eventType: string) => {
  const eventParts = eventType.split(":");
  const patternParts = pattern.split(":");
  return (
    eventType === pattern ||
    (patternParts.every(
      (element, index) => element === eventParts[index] || element === "*"
    ) &&
      (eventParts.length == patternParts.length ||
        (patternParts.length < eventParts.length &&
          patternParts[patternParts.length - 1] === "*")))
  );
};

export type Unsubscribe = () => void;

export type MessageBus = {
  trigger: <T extends Event>(event: T) => void;
  listen: (pattern: string, listener: Listener) => Unsubscribe;
  reply: <T, K>(message: string, responder: Responder<T, K>) => Unsubscribe;
  request: <T, R>(message: string, data: T) => Promise<R>;
};

const messageBus = (): MessageBus => {
  let listeners: { pattern: string; listener: Listener }[] = [];
  let responders: { message: string; responder: Responder }[] = [];

  return {
    trigger: <E extends Event>(event: E) =>
      listeners.forEach(
        ({ pattern, listener }) =>
          matchPattern(pattern, event.type) && listener(event)
      ),
    listen: (pattern, listener) => {
      listeners = listeners.concat({ pattern, listener });

      return () => {
        listeners = listeners.filter((e) => e.listener !== listener);
      };
    },
    reply: (message, responder) => {
      responders = responders
        .filter(({ message: m }) => message !== m)
        .concat({ message, responder });

      return () => {
        responders = responders.filter(({ responder: r }) => r !== responder);
      };
    },
    request: async <T, R>(message: string, data: T): Promise<R> => {
      const responder = responders.find((r) => r.message === message);
      if (!responder) {
        throw new Error(`No responder found for '${message}'`);
      }

      const result = await new Promise<R>((resolve) =>
        responder.responder(resolve, data)
      );

      return result;
    },
  };
};

export default messageBus;
