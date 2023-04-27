import { produce } from "immer";
import {
  ConditionElse,
  ConditionStatement,
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
import { ObservableList } from "./notificationList";

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
  state: GameStateManager<Game>,
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
  list: ObservableList<DisplayInfo<Game>>
): StatementHandler<Game, K> => {
  const statementMap: StatementMap<Game> = {
    Text: (statement, state, gameModelManager) => {
      const cpm = state.get().settings.cpm;
      const result: NarratorText = {
        type: "narratorText",
        cpm,
        text: [],
      };

      const text = handleTextContent(
        state,
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
    SetGameObjectText: ({ objectType, stateItem, name, text }, state) => {
      state.update(
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
    DescribeLocation: (_statement, state, gameModelManager) => {
      const locationData = getCurrentLocation(gameModelManager, state);
      if (locationData === undefined) return null;
      runScript(locationData.describe.script, state, gameModelManager, list);
    },
    Travel: ({ destination }, stateManager) => {
      stateManager.update((state) => ({
        ...state,
        currentLocation: destination,
      }));
    },
    UpdateGameObjectState: ({ stateItem, newState, objectType }, state) => {
      state.update(
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
    UpdateGameObjectFlag: ({ stateItem, flag, value, objectType }, state) => {
      state.update(
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
      state
    ) => {
      state.update(
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
    UpdateCharacterName: ({ character, newName, translatable }, state) => {
      state.update(
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
    CharacterSay: ({ character, sentences }, state, gameModelManager) => {
      if (!Object.hasOwn(state.get().characters, character)) {
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
        state.get(),
        gameModelManager.getModel()
      );

      const textScope = determineTextScope(state, String(character));

      const cpm = state.get().settings.cpm;
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
              state,
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
    Condition: (statement, state, gameModelManager) => {
      const test = (
        testStatement: ConditionStatement<Game> | ConditionElse<Game>
      ) => {
        if (testCondition(testStatement.condition, state)) {
          runScript(testStatement.body, state, gameModelManager, list);
        } else if (testStatement.else) {
          if (testStatement.else && "condition" in testStatement.else) {
            test(testStatement.else);
          } else {
            runScript(testStatement.else.body, state, gameModelManager, list);
          }
        }
      };
      test(statement);
    },
    OpenOverlay: (statement, state) => {
      state.update((state) => ({
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
    AddListItem: (statement, state) => {
      state.update(
        produce((state) => {
          const list = (state as GameState<Game>).lists[statement.list] || [];
          if (!list.includes(statement.value) || statement.unique === false) {
            list.push(statement.value);
          }
          (state as GameState<Game>).lists[statement.list] = list;
        })
      );
    },
    RemoveListItem: (statement, state) => {
      state.update(
        produce((state) => {
          const list = (
            (state as GameState<Game>).lists[statement.list] || []
          ).filter((item) => item !== statement.value);
          (state as GameState<Game>).lists[statement.list] = list;
        })
      );
    },
    DisplayList: (statement, state, gameModelManager) => {
      const listState = state.get().lists[statement.list] || [];
      listState.forEach((item) => {
        const displayScript = statement.values[item];
        if (!displayScript) return;
        runScript(displayScript, state, gameModelManager, list);
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
  state: GameStateManager<Game>,
  gameModelManager: GameModelManager<Game>,
  list: ObservableList<DisplayInfo<Game>>
): void => {
  for (const statement of script) {
    if (isContentPluginStatement(statement)) {
      const plugin = getContentPlugin(statement.source);
      if (plugin) {
        list.add(
          ...plugin.handleContent(statement, state, gameModelManager.getModel())
        );
      }
    } else {
      const handler = statementHandler<Game, ScriptStatement<Game>>(
        statement.statementType,
        list
      );
      handler(statement, state, gameModelManager);
    }
  }
};
