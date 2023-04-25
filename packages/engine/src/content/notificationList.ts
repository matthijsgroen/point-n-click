export type Subscriber<T> = (list: NotificationList<T>) => void;
export type Unsubscribe = () => void;

export type NotificationList<T> = {
  getCollection(): T[];
  add(...items: T[]): void;
  subscribe(subscription: Subscriber<T>): Unsubscribe;
};

export const notificationList = <T>(): NotificationList<T> => {
  const list: T[] = [];
  let subscriptions: Subscriber<T>[] = [];

  const result: NotificationList<T> = {
    getCollection: () => list,
    add: (...items: T[]) => {
      list.push(...items);
      subscriptions.forEach((s) => s(result));
    },
    subscribe: (subscriber) => {
      subscriptions = subscriptions.concat(subscriber);
      return () => {
        subscriptions = subscriptions.filter((s) => s != subscriber);
      };
    },
  };
  return result;
};
