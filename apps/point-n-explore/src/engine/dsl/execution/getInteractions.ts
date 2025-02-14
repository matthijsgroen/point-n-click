import { Interactions, NewScript } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { createReadOnlyProxy } from "./proxy/readOnlyProxy";

export type Interaction<
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`],
  Extra = unknown
> = {
  label: string;
  enabled: boolean;
  action: NewScript<Game, ItemType, Item, Extra>;
};

export const getInteractions = <
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`],
  Extra = unknown
>(
  interactions: Interactions<Game, ItemType, Item, Extra>,
  state: GameState<Game>,
  itemType: ItemType,
  item: Item
): Interaction<Game, ItemType, Item, Extra>[] => {
  const result: Interaction<Game, ItemType, Item, Extra>[] = [];
  const stateProxy = createReadOnlyProxy(state, itemType, item, {
    addAction: (action: Interaction<Game, ItemType, Item, Extra>) => {
      result.push(action);
    },
  });

  interactions(stateProxy);
  return result;
};
