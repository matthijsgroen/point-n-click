import { NewScript, ScriptHelper } from "../syntax/script";
import { GameState } from "../syntax/state";
import type { ContentPlugin, DSLExtension } from "../types/plugins";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { createReadWriteProxy } from "./proxy/readWriteProxy";

export const runScript = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`],
  Plugins extends readonly ContentPlugin<string, DSLExtension>[] = [],
  Extra = unknown
>(
  script: NewScript<Game, StateObject, string, Plugins, Extra>,
  state: GameState<Game>,
  plugins: Plugins,
  currentItemType: ItemType,
  currentItemName: ItemName
): Action<Game>[] => {
  let newState = state;
  const actions: Action<Game>[] = [];

  const applyPatch = (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => {
    actions.push({
      type: "state",
      patch,
    });
    newState = patch(newState);
  };

  const worldHelper = createReadWriteProxy(
    () => newState,
    actions,
    applyPatch,
    plugins,
    currentItemType,
    currentItemName
  ) as ScriptHelper<Game, ItemType, ItemName, Plugins> & Extra;

  script(worldHelper);

  return actions;
};
