import { NewScript } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { createScriptHelper } from "./stateProxy";

export const runScript = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  script: NewScript<Game, StateObject, string>,
  state: GameState<Game>,
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

  const worldHelper = createScriptHelper(
    () => newState,
    actions,
    applyPatch,
    currentItemType,
    currentItemName
  );

  script(worldHelper);

  return actions;
};
