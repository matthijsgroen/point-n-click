import { NewScript, ScriptHelper } from "../syntax/script";
import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { stateItemProxy } from "./stateProxy";

const characterHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  actions: Action<Game>[],
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
): ScriptHelper<Game, "character", string>["characters"] =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            say: (...text: string[]) => {
              actions.push({
                type: "say",
                character: String(prop),
                text,
              });
            },
          },
          stateItemProxy(getState, updateState, "character", String(prop))
        );
      },
    }
  ) as ScriptHelper<Game, "character", string>["characters"];

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

  const worldHelper: ScriptHelper<Game, StateObject, string> = new Proxy(
    {
      characters: characterHelper<Game>(() => newState, actions, applyPatch),
      items: {},
      locations: {},
      lists: {},
      text: (...text: string[]) => {
        actions.push({
          type: "text",
          text,
        });
      },
    },
    stateItemProxy(() => newState, applyPatch, currentItemType, currentItemName)
  ) as ScriptHelper<Game, StateObject, string>;

  script(worldHelper);

  return actions;
};
