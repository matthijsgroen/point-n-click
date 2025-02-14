import { ReadStateHelper } from "../../syntax/script";
import { GameState, ObjectGroupState, ObjectState } from "../../syntax/state";
import { GameWorld, StateObject } from "../../types/world";
import { isFlag } from "./isFlag";

const readStateItemProxy = <
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
    if (isFlag(itemType, itemName, prop)) {
      if (!itemState) {
        return false;
      }
      return itemState?.[prop as keyof typeof itemState] ?? false;
    }
    if (prop === "state") {
      return itemState?.state ?? "unknown";
    }
    if (itemState) {
      return (
        (itemState as Record<string, number | undefined>)[prop as string] ?? 0
      );
    }
  },
});

const readonlyItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject
>(
  state: GameState<Game>,
  entry: ItemType
) =>
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

export const createReadOnlyProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`],
  Actions extends Record<string, unknown>
>(
  state: GameState<Game>,
  key: ItemType,
  item: ItemName,
  actions: Actions
) =>
  new Proxy(
    {
      ...actions,
      characters: readonlyItemProxy(state, "character"),
      overlays: readonlyItemProxy(state, "overlay"),
      items: readonlyItemProxy(state, "item"),
      locations: readonlyItemProxy(state, "location"),
    },
    readStateItemProxy(state, key, item)
  ) as ReadStateHelper<Game, ItemType, ItemName> & Actions;
