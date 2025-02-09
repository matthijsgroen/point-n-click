import { CharactersHelper, NewScript, ScriptHelper, StateObject } from "../syntax/script";
import { GameState } from "../types/state";
import { RecursivePartial } from "../types/utils";
import { GameWorld } from "../types/world";
import { Action } from "./actions";
import { stateItemProxy } from "./stateProxy";

export type ScriptResult<Game extends GameWorld> =  {
  actionList: Action<Game>[];
};

const characterHelper = <Game extends GameWorld>(
  getState: () => RecursivePartial<GameState<Game>>,
  actions: Action<Game>[],
  updateState: (newState: RecursivePartial<GameState<Game>>) => void
): CharactersHelper<Game> =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            _itemType: "character",
            _itemName: String(prop),
            say: (...text: string[]) => {
              actions.push({
                type: "say",
                character: String(prop),
                text,
              });
            },
          },
          stateItemProxy(getState, updateState)
        );
      },
    }
  ) as CharactersHelper<Game>;

export const runScript = <Game extends GameWorld>(
  script: NewScript<Game, StateObject, string>,
  state: RecursivePartial<GameState<Game>>
): ScriptResult<Game> => {
  let newState = state;
  const actions: Action<Game>[] = [];

  const worldHelper: ScriptHelper<Game, StateObject, string> = {
    characters: characterHelper<Game>(
      () => newState,
      actions,
      (update) => {
        newState = update;
      }
    ),
    items: {},
    locations: {},
    lists: {},
    text: (...text: string[]) => {
      actions.push({
        type: "text",
        text,
      });
    },
  };

  script(worldHelper);

  return {
    actionList: actions,
  };
};
