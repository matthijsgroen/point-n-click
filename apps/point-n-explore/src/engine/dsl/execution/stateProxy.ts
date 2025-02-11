import { produce } from "immer";
import { GameWorld, StateObject } from "../types/world";
import {
  GameState,
  ObjectGroupState,
  ObjectState,
  PartialObjectGroupState,
} from "../syntax/state";
import { ReadStateHelper } from "../syntax/script";

const isFlag = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  _itemType: ItemType,
  _itemName: ItemName,
  prop: unknown
): prop is Game[`${ItemType}s`][ItemName]["flags"] & string =>
  String(prop).startsWith("is") ||
  String(prop).startsWith("has") ||
  String(prop).startsWith("can") ||
  String(prop).startsWith("knows");

export const stateItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  getState: () => GameState<Game>,
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void,
  itemType: ItemType,
  itemName: ItemName
) => ({
  get(
    target: {
      [key: string]: unknown;
    },
    prop: string | symbol,
    receiver: unknown
  ) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const itemState = getState()[`${itemType}s`]?.[itemName];
    if (isFlag(itemType, itemName, prop)) {
      if (!itemState) {
        return false;
      }
      console.log("itemState", itemState);
    }
    if (prop === "state") {
      return itemState?.state ?? "unknown";
    }
  },
  set(
    _target: { [key: string]: unknown },
    prop: string | symbol,
    value: string | number | boolean
  ) {
    if (String(prop) === "state") {
      console.log("set", itemType, itemName, prop, value);
      updateState(
        produce((currentState) => {
          type ItemsState = PartialObjectGroupState<
            Game,
            ItemType,
            { name?: string; [key: string]: unknown }
          >;
          (currentState[`${itemType}s`] as ItemsState | undefined) ??=
            {} as ItemsState;

          (currentState[`${itemType}s`] as ItemsState)[itemName] ??= {};
          (currentState[`${itemType}s`] as ItemsState)[itemName].state =
            value as ItemsState[typeof itemName]["state"];
        })
      );
    }
    if (isFlag(itemType, itemName, prop)) {
      console.log("set", itemType, itemName, prop, value);
      updateState(
        produce((currentState) => {
          type ItemsState = PartialObjectGroupState<
            Game,
            ItemType,
            { name?: string }
          >;
          (currentState[`${itemType}s`] as ItemsState | undefined) ??=
            {} as ItemsState;

          (currentState[`${itemType}s`] as ItemsState)[itemName] ??= {};

          (
            (currentState[`${itemType}s`] as ItemsState)[itemName] as {
              [key: string]: string | boolean | number;
            }
          )[prop] = value;
        })
      );
    }
    return true;
  },
});

export const readStateItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  state: GameState<Game>,
  itemType: ItemType,
  itemName: ItemName
) => ({
  get(
    target: {
      [key: string]: unknown;
    },
    prop: string | symbol,
    receiver: unknown
  ) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const itemState = state[`${itemType}s`]?.[itemName] as ObjectState<
      Game,
      ItemType,
      ItemName
    >;
    console.log("path", `${itemType}s`, itemName, prop);
    if (isFlag(itemType, itemName, prop)) {
      if (!itemState) {
        return false;
      }
      return itemState?.[prop as keyof typeof itemState] ?? false;
    }
    if (prop === "state") {
      return itemState?.state ?? "unknown";
    }
    console.log("other", itemState, String(prop));
  },
});

const readonlyItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject
>(
  state: GameState<Game>,
  entry: ItemType
): ObjectGroupState<Game, ItemType> =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            get name() {
              return (state[`${entry}s`]?.[String(prop)] as { name?: string })
                ?.name;
            },
          },
          readStateItemProxy(state, entry, String(prop))
        );
      },
    }
  ) as ObjectGroupState<Game, ItemType>;

export const getReadStateProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  state: GameState<Game>,
  key: ItemType,
  item: ItemName
): ReadStateHelper<Game, ItemType, ItemName> =>
  new Proxy(
    {
      characters: readonlyItemProxy(state, "character"),
      overlays: readonlyItemProxy(state, "overlay"),
      items: readonlyItemProxy(state, "item"),
      locations: readonlyItemProxy(state, "location"),
    },
    readStateItemProxy(state, key, item)
  ) as ReadStateHelper<Game, ItemType, ItemName>;
