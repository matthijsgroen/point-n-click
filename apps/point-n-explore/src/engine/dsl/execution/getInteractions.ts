import { Interactions, NewScript } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { getReadStateProxy } from "./stateProxy";

export type Interaction<
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`]
> = {
  name: string;
  enabled: boolean;
  actionScript: NewScript<Game, ItemType, Item>;
};

export const getInteractions = <
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`]
>(
  interactions: Interactions<Game, ItemType, Item>,
  state: GameState<Game>,
  itemType: ItemType,
  item: Item
): Interaction<Game, ItemType, Item>[] => {
  const result: Interaction<Game, ItemType, Item>[] = [];
  const stateProxy = getReadStateProxy(state, itemType, item);

  const action = (
    name: string,
    enabled: boolean,
    actionScript: NewScript<Game, ItemType, Item>
  ) => {
    result.push({
      name,
      enabled,
      actionScript,
    });
  };

  interactions(stateProxy, action);
  return result;
};
