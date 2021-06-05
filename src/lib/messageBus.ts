export interface Event {
  type: string;
}

export type Listener = (event: Event) => void;

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
};

const messageBus = (): MessageBus => {
  let listeners: { pattern: string; listener: Listener }[] = [];

  return {
    trigger: (event) =>
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
  };
};

export default messageBus;
