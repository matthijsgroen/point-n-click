import { GameData } from "../syntax/dsl";
import { ObjectScriptHelper, Script } from "../syntax/script";
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
  script: Script<Game, StateObject, string, Plugins, Extra>,
  state: GameState<Game>,
  content: GameData<Game, Plugins>,
  currentItemType: ItemType,
  currentItemName: ItemName
): Action<Game>[] => {
  let newState = state;
  const actions: Action<Game>[] = [];
  const addAction = (action: Action<Game>) => {
    if (action.type === "scene") {
      const scene = content.scenes[action.scene];
      if (!scene) {
        actions.push({
          type: "error",
          message: `Scene "${action.scene}" not found`,
        });
        return;
      }

      const sceneHelper = createReadWriteProxy(
        () => newState,
        addAction,
        applyPatch,
        content.plugins
      ) as ObjectScriptHelper<Game, ItemType, ItemName, Plugins> & Extra;
      scene(sceneHelper);
      return;
    }

    actions.push(action);
  };

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
    addAction,
    applyPatch,
    content.plugins,
    currentItemType,
    currentItemName
  ) as ObjectScriptHelper<Game, ItemType, ItemName, Plugins> & Extra;

  script(worldHelper);

  return actions;
};
