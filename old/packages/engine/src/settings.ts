type Subscriber<T> = (newSettings: T, previousSettings: T) => void;
/**
 * Unsubscribes from the settings
 */
type Unsubscribe = () => void;

type Settings<T extends Record<string, unknown>> = {
  get: () => T;
  update: (update: Partial<T>) => void;
  subscribe: (subscriber: Subscriber<Readonly<T>>) => Unsubscribe;
};

export const settings = <T extends Record<string, unknown>>(
  initialSettings: T
): Settings<T> => {
  let settings: T = initialSettings;

  let subscriptions: Subscriber<T>[] = [];

  return {
    get: () => settings,
    update: (updates) => {
      const previousSettings = Object.freeze(settings);

      settings = { ...settings, ...updates };

      const notifySettings = Object.freeze(settings);
      subscriptions.forEach((s) => s(notifySettings, previousSettings));
    },
    subscribe: (subscriber: Subscriber<T>): Unsubscribe => {
      subscriptions = subscriptions.concat(subscriber);

      return () => {
        subscriptions = subscriptions.filter((s) => s !== subscriber);
      };
    },
  };
};
