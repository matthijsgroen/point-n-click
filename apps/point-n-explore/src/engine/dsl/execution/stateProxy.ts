import {
  GameState,
  ObjectReadStateHelper,
  ReadStateHelper,
  StateObject,
} from "../syntax/script";
import { RecursivePartial } from "../types/utils";
import { GameWorld } from "../types/world";

const isFlag = (prop: string | symbol) =>
  String(prop).startsWith("is") ||
  String(prop).startsWith("has") ||
  String(prop).startsWith("can") ||
  String(prop).startsWith("knows");

export const stateItemProxy = (
  getState: () => any,
  _updateState: (newState: any) => void
) => ({
  get(
    target: { _itemType: StateObject; _itemName: string } & {
      [key: string]: unknown;
    },
    prop: string | symbol,
    receiver: any
  ) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const itemState = getState()[`${target._itemType}s`]?.[target._itemName];
    if (isFlag(prop)) {
      if (!itemState) {
        return false;
      }
      console.log("itemState", itemState);
    }
  },
});

export const readStateItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  state: RecursivePartial<GameState<Game>>,
  itemType: ItemType,
  itemName: ItemName
) => ({
  get(
    target: {
      [key: string]: unknown;
    },
    prop: string | symbol,
    receiver: any
  ) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const itemState = state[`${itemType}s`]?.[itemName];
    console.log("path", `${itemType}s`, itemName, prop);
    if (isFlag(prop)) {
      if (!itemState) {
        return false;
      }
      console.log("itemState", itemState);
    }
    if (prop === "state") {
      return itemState?.state ?? "unknown";
    }
  },
});

const readonlyCharacterProxy = <Game extends GameWorld>(
  state: RecursivePartial<GameState<Game>>
): ReadStateHelper<Game, "character"> =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            _itemType: "character",
            _itemName: String(prop),
            get name() {
              // TODO: Add real implementation
              return "Truus";
            },
          },
          readStateItemProxy(state, "character", String(prop))
        );
      },
    }
  ) as ReadStateHelper<Game, "character">;

export const getReadStateProxy = <
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
>(
  state: RecursivePartial<GameState<Game>>,
  key: T,
  item: Item
): GameState<Game> & ObjectReadStateHelper<Game, T, Item> => {
  return new Proxy(
    {
      characters: readonlyCharacterProxy(state),
    },
    readStateItemProxy(state, key, item)
  ) as GameState<Game> & ObjectReadStateHelper<Game, T, Item>;
};
