export type Subscriber<T> = (list: ObservableList<T>) => void;
export type Unsubscribe = () => void;

export type ObservableList<T> = {
  getCollection(): T[];
  length: number;
  add(...items: T[]): void;
  subscribe(subscription: Subscriber<T>): Unsubscribe;
};

export const observableList = <T>(): ObservableList<T> => {
  const list: T[] = [];
  let subscriptions: Subscriber<T>[] = [];

  const result: ObservableList<T> = {
    getCollection: () => list,
    get length() {
      return list.length;
    },
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
