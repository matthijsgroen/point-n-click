export type NotificationList<T> = {
  getCollection(): T[];
  add(...items: T[]): void;
};

export const notificationList = <T>(): NotificationList<T> => {
  const list: T[] = [];

  return {
    getCollection: () => list,
    add: (...items: T[]) => {
      list.push(...items);
    },
  };
};
