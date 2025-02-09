import { GameState, Interactions, StateObject } from "../syntax/script";
import { RecursivePartial } from "../types/utils";
import { GameWorld } from "../types/world";
import { getReadStateProxy } from "./stateProxy";

type Interaction = {
  name: string;
  enabled: boolean;
  actionScript: (s: RecursivePartial<GameState<Game>>) => void;
};

export const getInteractions = <
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`]
>(
  interactions: Interactions<Game, ItemType, Item>,
  state: RecursivePartial<GameState<Game>>,
  itemType: ItemType,
  item: Item
): Interaction[] => {
  const result: Interaction[] = [];

  const stateProxy = getReadStateProxy(state, itemType, item);

  const action = (name: string, enabled: boolean, actionScript: any) => {
    result.push({
      name,
      enabled,
      actionScript,
    });
  };

  interactions(stateProxy, action);
  return result;
};
