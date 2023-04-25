import { produce } from "immer";
import {
  ContentPluginContent,
  DisplayErrorText,
  GameObjectState,
  GameState,
  GameStateManager,
  GameWorld,
  ScriptAST,
  ScriptStatement,
} from "@point-n-click/types";
import { testCondition } from "@point-n-click/state";
import { getDisplayText, ParseSyntaxError } from "../text/processText";
import { determineTextScope } from "../text/determineTextScope";
import { FormattedText } from "../text/types";
import { formatParserError, formatStateError } from "../errors/formatErrors";
import { characterName, StateError } from "../text/applyState";
import { getTranslationText } from "../text/getTranslationText";
import { getContentPlugin, isContentPluginStatement } from "../contentPlugin";
import { handleTextContent } from "../text/handleText";
import { getCurrentLocation } from "./getLocation";
import { GameModelManager } from "../model/gameModel";
import { NotificationList } from "./displayInfoCollection";

type NarratorText = {
  type: "narratorText";
  cpm: number;
  text: FormattedText[];
};

type CharacterText<Game extends GameWorld> = {
  type: "characterText";
  character: keyof Game["characters"];
  cpm: number;
  text: FormattedText[];
  displayName?: string;
};

export type DisplayInfo<Game extends GameWorld> =
  | DisplayErrorText
  | NarratorText
  | CharacterText<Game>
  | ContentPluginContent;

type StatementHandler<
  Game extends GameWorld,
  K extends ScriptStatement<Game>
> = (
  statement: K,
  stateManager: GameStateManager<Game>,
  modelManager: GameModelManager<Game>
) => void;

type StatementMap<Game extends GameWorld> = {
  [K in ScriptStatement<Game> as K["statementType"]]: StatementHandler<Game, K>;
};

const statementHandler = <
  Game extends GameWorld,
  K extends ScriptStatement<Game>
>(
  statementType: K["statementType"],
  list: NotificationList<DisplayInfo<Game>>
): StatementHandler<Game, K> => {
  const statementMap: StatementMap<Game> = {
    Text: (statement, stateManager, gameModelManager) => {
      const cpm = stateManager.get().settings.cpm;
      const result: NarratorText = {
        type: "narratorText",
        cpm,
        text: [],
      };

      const text = handleTextContent(
        stateManager,
        gameModelManager.getModel(),
        statement.sentences,
        "text"
      );
      result.text = text.result;
      list.add(result);

      if (text.error) {
        list.add(text.error);
      }
    },
    SetGameObjectText: (
      { objectType, stateItem, name, text },
      stateManager
    ) => {
      stateManager.update(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][
            stateItem
          ] as { texts?: Record<string, string> };
          if (item) {
            if (item.texts === undefined) {
              item.texts = {};
            }
            item.texts[name as string] = text;
          } else if (objectType === "item") {
            type ItemState = GameObjectState<Game["items"][typeof stateItem]>;
            const itemState: ItemState = {
              state: "unknown",
              flags: {},
              counters: {},
              texts: { [name as string]: text },
            } as unknown as ItemState;
            (draft as GameState<Game>).items[stateItem as keyof Game["items"]] =
              itemState;
          }
        })
      );
    },
    DescribeLocation: (_statement, stateManager, gameModelManager) => {
      const locationData = getCurrentLocation(gameModelManager, stateManager);
      if (locationData === undefined) return null;
      runScript(
        locationData.describe.script,
        stateManager,
        gameModelManager,
        list
      );
    },
    Travel: ({ destination }, stateManager) => {
      stateManager.update((state) => ({
        ...state,
        currentLocation: destination,
      }));
    },
    UpdateGameObjectState: (
      { stateItem, newState, objectType },
      stateManager
    ) => {
      stateManager.update(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][
            stateItem
          ] as { state?: string };
          if (item) {
            item.state = newState;
          } else if (objectType === "item") {
            type ItemState = GameObjectState<Game["items"][typeof stateItem]>;
            const itemState: ItemState = {
              state: newState as ItemState["state"],
              flags: {},
              counters: {},
              texts: {} as ItemState["texts"],
            };
            (draft as GameState<Game>).items[stateItem as keyof Game["items"]] =
              itemState;
          }
        })
      );
    },
    UpdateGameObjectFlag: (
      { stateItem, flag, value, objectType },
      stateManager
    ) => {
      stateManager.update(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][
            stateItem
          ] as { flags?: Record<string, boolean> };
          if (item && item.flags) {
            item.flags[String(flag)] = value;
          } else if (objectType === "item") {
            type ItemState = GameObjectState<Game["items"][typeof stateItem]>;
            const itemState: ItemState = {
              state: "unknown",
              flags: { [String(flag)]: value } as ItemState["flags"],
              counters: {},
              texts: {} as ItemState["texts"],
            };
            (draft as GameState<Game>).items[stateItem as keyof Game["items"]] =
              itemState;
          }
        })
      );
    },
    UpdateGameObjectCounter: (
      { stateItem, value, name, transactionType, objectType },
      stateManager
    ) => {
      stateManager.update(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][
            stateItem
          ] as { counters: Record<string, number> };
          const prevValue = item ? item.counters[String(name)] : 0;

          const nextValue = (() => {
            switch (transactionType) {
              case "set":
                return value;
              case "decrease":
                return prevValue - value;
              case "increase":
                return prevValue + value;
            }
          })();

          if (item && item.counters !== undefined) {
            item.counters[String(name)] = nextValue;
          } else {
            if (objectType === "item") {
              type ItemState = GameObjectState<Game["items"][typeof stateItem]>;
              const itemState: ItemState = {
                state: "unknown",
                flags: {},
                counters: {
                  [String(name)]: nextValue,
                } as ItemState["counters"],
                texts: {} as ItemState["texts"],
              };
              (draft as GameState<Game>).items[
                stateItem as keyof Game["items"]
              ] = itemState;
            }
          }
        })
      );
    },
    UpdateCharacterName: (
      { character, newName, translatable },
      stateManager
    ) => {
      stateManager.update(
        produce((draft) => {
          if (translatable && newName) {
            const translatedName =
              getTranslationText(
                ["characters", String(character), "names"],
                newName
              ) ?? newName;
            (draft as GameState<Game>).characters[character].name =
              translatedName;
          } else {
            (draft as GameState<Game>).characters[character].name = newName;
          }
        })
      );
    },
    CharacterSay: (
      { character, sentences },
      stateManager,
      gameModelManager
    ) => {
      if (!Object.hasOwn(stateManager.get().characters, character)) {
        const error: DisplayErrorText = {
          type: "error",
          message: [
            [
              {
                type: "text",
                text: `Character not found: '${String(character)}'`,
              },
            ],
          ],
        };
        list.add(error);
        return;
      }
      const name = characterName(
        character,
        stateManager.get(),
        gameModelManager.getModel()
      );

      const textScope = determineTextScope(stateManager, String(character));

      const cpm = stateManager.get().settings.cpm;
      const result: CharacterText<Game> = {
        type: "characterText",
        cpm,
        character,
        displayName: name,
        text: [],
      };

      for (const sentence of sentences) {
        try {
          result.text.push(
            getDisplayText(
              sentence,
              stateManager,
              gameModelManager.getModel(),
              textScope,
              ["characters", String(character)]
            )
          );
        } catch (e) {
          if ((e as ParseSyntaxError).name === "SyntaxError") {
            return [result, formatParserError(e as ParseSyntaxError)];
          }
          if ((e as StateError).name === "StateError") {
            return [result, formatStateError(sentence, e as StateError)];
          }
          break;
        }
      }
      list.add(result);
    },
    Condition: (
      { condition, body, elseBody },
      stateManager,
      gameModelManager
    ) => {
      if (testCondition(condition, stateManager)) {
        runScript(body, stateManager, gameModelManager, list);
      } else {
        runScript(elseBody, stateManager, gameModelManager, list);
      }
    },
    OpenOverlay: (statement, stateManager) => {
      stateManager.update((state) => ({
        ...state,
        overlayStack: state.overlayStack.concat(statement.overlayId),
      }));
    },
    CloseOverlay: ({ overlayId }, stateManager) => {
      stateManager.update(
        produce((draft) => {
          draft.overlayStack = draft.overlayStack.filter(
            (id) => id !== overlayId
          );
        })
      );
    },
    AddListItem: (statement, stateManager) => {
      stateManager.update(
        produce((state) => {
          const list = (state as GameState<Game>).lists[statement.list] || [];
          if (!list.includes(statement.value) || statement.unique === false) {
            list.push(statement.value);
          }
          (state as GameState<Game>).lists[statement.list] = list;
        })
      );
    },
    RemoveListItem: (statement, stateManager) => {
      stateManager.update(
        produce((state) => {
          const list = (
            (state as GameState<Game>).lists[statement.list] || []
          ).filter((item) => item !== statement.value);
          (state as GameState<Game>).lists[statement.list] = list;
        })
      );
    },
    DisplayList: (statement, stateManager, gameModelManager) => {
      const listState = stateManager.get().lists[statement.list] || [];
      listState.forEach((item) => {
        const displayScript = statement.values[item];
        if (!displayScript) return;
        runScript(displayScript, stateManager, gameModelManager, list);
      });
    },
  };

  return statementMap[statementType] as (
    statement: K,
    stateManager: GameStateManager<Game>,
    gameModelManager: GameModelManager<Game>
  ) => void;
};

export const runScript = <Game extends GameWorld>(
  script: ScriptAST<Game>,
  stateManager: GameStateManager<Game>,
  gameModelManager: GameModelManager<Game>,
  list: NotificationList<DisplayInfo<Game>>
): DisplayInfo<Game>[] => {
  const result: DisplayInfo<Game>[] = [];
  for (const statement of script) {
    // if (stateManager.isAborting()) {
    //   return result;
    // }

    if (isContentPluginStatement(statement)) {
      const plugin = getContentPlugin(statement.source);
      if (plugin) {
        result.push(
          ...plugin.handleContent(
            statement,
            stateManager,
            gameModelManager.getModel()
          )
        );
        list.add(
          ...plugin.handleContent(
            statement,
            stateManager,
            gameModelManager.getModel()
          )
        );
      }
    } else {
      const handler = statementHandler<Game, ScriptStatement<Game>>(
        statement.statementType,
        list
      );
      handler(statement, stateManager, gameModelManager);
      // if (statementResult !== null) {
      //   result.push(...statementResult);
      // }
    }
  }
  return result;
};
