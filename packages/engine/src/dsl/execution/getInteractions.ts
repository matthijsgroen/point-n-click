import { Interactions, NewScript } from "../syntax/script";
import { GameState } from "../syntax/state";
import { ContentPlugin, DSLExtension } from "../types/plugins";
import { GameWorld, StateObject } from "../types/world";
import { createReadOnlyProxy } from "./proxy/readOnlyProxy";

export type Interaction<
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`],
  Plugins extends readonly ContentPlugin<string, DSLExtension>[] = [],
  Extra = unknown
> = {
  label: string;
  enabled: boolean;
  action: NewScript<Game, ItemType, Item, Plugins, Extra>;
};

export const getInteractions = <
  Game extends GameWorld,
  ItemType extends StateObject,
  Item extends keyof Game[`${ItemType}s`],
  Plugins extends readonly ContentPlugin<string, DSLExtension>[] = [],
  Extra = unknown
>(
  interactions: Interactions<Game, ItemType, Item, Plugins, Extra>,
  state: GameState<Game>,
  itemType: ItemType,
  item: Item
): Interaction<Game, ItemType, Item, Plugins, Extra>[] => {
  const result: Interaction<Game, ItemType, Item, Plugins, Extra>[] = [];
  const stateProxy = createReadOnlyProxy(state, itemType, item, {
    addAction: (action: Interaction<Game, ItemType, Item, Plugins, Extra>) => {
      result.push(action);
    },
  });

  interactions(stateProxy);
  return result;
};
