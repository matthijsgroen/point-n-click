import type { Dispatch, SetStateAction } from "react";

import { useCallback, useEffect, useState } from "react";
import localForage from "localforage";

const isSetFunction = <T>(v: SetStateAction<T>): v is (prevValue: T) => T =>
  typeof v === "function";

type Store = {
  getItem: <T>(key: string) => Promise<T | null>;
  setItem: <T>(key: string, value: T) => Promise<T | null>;
  removeItem: (key: string) => Promise<void>;
  subscribe: <T>(key: string, callback: (value: T) => void) => VoidFunction;
};

const stores = new Map<string, Store>();

export const getStore = (storeName: string): Store => {
  const store = stores.get(storeName);
  if (store) {
    return store;
  }

  const forage = localForage.createInstance({
    driver: [localForage.INDEXEDDB, localForage.LOCALSTORAGE],
    name: storeName,
  });
  let subscribers: { key: string; callback: <T>(newValue: T) => void }[] = [];

  const newStore: Store = {
    getItem: async <T>(key: string) => forage.getItem<T>(key),
    setItem: async <T>(key: string, value: T) => {
      await forage.setItem<T>(key, value);
      subscribers.forEach((sub) => {
        if (sub.key === key) {
          sub.callback(value);
        }
      });
      return value;
    },
    removeItem: async (key) => {
      await forage.removeItem(key);
    },
    subscribe: <T>(key: string, callback: (value: T) => void) => {
      subscribers.push({ key, callback } as {
        key: string;
        // eslint-disable-next-line no-shadow
        callback: <T>(value: T) => void;
      });
      return () => {
        subscribers = subscribers.filter((sub) => sub.callback !== callback);
      };
    },
  };

  stores.set(storeName, newStore);
  return newStore;
};

/**
 * Store data in IndexedDB, for local offline storage
 *
 * Take note: This is an asynchronous API, the first value returned is always undefined,
 * and it will rerender when the real value is available.
 *
 * When updating the value, always use the function form of `setValue` to ensure the latest value is used.
 *
 * This hook will create a subscription to the store, so that if one hook updates the value in the store, other hooks get notified.
 *
 */
export const useOfflineStorage = <T>(
  key: string,
  initialValue: T | (() => T),
  storeName = "defaultStore"
): [
  value: T | undefined,
  setValue: Dispatch<SetStateAction<T>>,
  deleteValue: (optimistic?: boolean) => Promise<void>
] => {
  const [initializedInitValue] = useState(
    // Only execute the potentially expensive function once
    typeof initialValue === "function"
      ? (initialValue as () => T)()
      : initialValue
  );
  const [localState, setLocalState] = useState<T | undefined>(undefined);
  const store = getStore(storeName);

  useEffect(() => {
    if (localState !== undefined) {
      console.log("storing value in offline state", localState);
      store.setItem<T>(key, localState);
    }
  }, [storeName, key, localState]);

  useEffect(() => {
    store
      .getItem<T>(key)
      .then(async (value) => {
        if (value !== null) {
          setLocalState(value);
        } else if (initializedInitValue !== null) {
          setLocalState(initializedInitValue);
        }
      })
      .catch((_e) => {
        // 'Error getting item from store'
        setLocalState(undefined);
      });
  }, [store, key, initializedInitValue]);

  const setValue = useCallback(
    async (value: SetStateAction<T>) => {
      console.log("storing value in local state");
      if (isSetFunction(value)) {
        setLocalState((previous) => value(previous ?? initializedInitValue)); // Optimistic
      } else {
        setLocalState(value); // Optimistic
      }
    },
    [key, initializedInitValue]
  );

  const deleteValue = useCallback(
    async (optimistic = true) => {
      if (optimistic) {
        setLocalState(initializedInitValue);
      }
      // await store.removeItem(key);
    },
    [key, initializedInitValue]
  );

  return [localState, setValue, deleteValue];
};
