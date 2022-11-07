import produce from "immer";
import { GameWorld, ScriptStatement, ScriptAST } from "@point-n-click/types";
import {
  GameState,
  GameStateManager,
  testCondition,
} from "@point-n-click/state";
import { getDisplayText, ParseSyntaxError } from "../text/processText";
import { determineTextScope } from "../text/determineTextScope";
import { FormattedText } from "../text/types";
import {
  DisplayErrorText,
  formatParserError,
  formatStateError,
} from "../errors/formatErrors";
import { characterName, StateError } from "../text/applyState";
import { getTranslationText } from "../text/getTranslationText";

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
  | CharacterText<Game>;

type StatementHandler<
  Game extends GameWorld,
  K extends ScriptStatement<Game>
> = (
  statement: K,
  stateManager: GameStateManager<Game>
) => DisplayInfo<Game>[] | null;

type StatementMap<Game extends GameWorld> = {
  [K in ScriptStatement<Game> as K["statementType"]]: StatementHandler<Game, K>;
};

const statementHandler = <
  Game extends GameWorld,
  K extends ScriptStatement<Game>
>(
  statementType: K["statementType"]
): StatementHandler<Game, K> => {
  const statementMap: StatementMap<Game> = {
    Text: (statement, stateManager) => {
      const textScope = determineTextScope(stateManager, "text");

      const cpm = stateManager.getState().settings.cpm;
      const result: NarratorText = {
        type: "narratorText",
        cpm,
        text: [],
      };

      for (const sentence of statement.sentences) {
        try {
          result.text.push(
            getDisplayText(sentence, stateManager, textScope, textScope)
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
      return [result];
    },
    Travel: ({ destination }, stateManager) => {
      stateManager.updateState((state) => ({
        ...state,
        currentLocation: destination,
      }));
      return null;
    },
    UpdateGameObjectState: (
      { stateItem, newState, objectType },
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][stateItem];
          if (item) {
            item.state = newState;
          } else if (objectType === "item") {
            (draft as GameState<Game>).items[stateItem] = {
              state: newState,
              flags: {},
              counters: {},
            };
          }
        })
      );
      return null;
    },
    UpdateGameObjectFlag: (
      { stateItem, flag, value, objectType },
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][stateItem];
          if (item) {
            item.flags[String(flag)] = value;
          } else if (objectType === "item") {
            (draft as GameState<Game>).items[stateItem] = {
              state: "unknown",
              flags: { [String(flag)]: value },
              counters: {},
            };
          }
        })
      );
      return null;
    },
    UpdateGameObjectCounter: (
      { stateItem, value, name, transactionType, objectType },
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          const item = (draft as GameState<Game>)[`${objectType}s`][stateItem];
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

          if (item) {
            item.counters[String(name)] = nextValue;
          } else {
            if (objectType === "item") {
              (draft as GameState<Game>).items[stateItem] = {
                state: "unknown",
                flags: {},
                counters: { [String(name)]: nextValue },
              };
            }
          }
        })
      );
      return null;
    },
    UpdateCharacterName: (
      { character, newName, translatable },
      stateManager
    ) => {
      stateManager.updateState(
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
      return null;
    },
    CharacterSay: ({ character, sentences }, stateManager) => {
      if (!Object.hasOwn(stateManager.getState().characters, character)) {
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
        return [error];
      }
      const name = characterName(character, stateManager.getState());

      const textScope = determineTextScope(stateManager, String(character));

      const cpm = stateManager.getState().settings.cpm;
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
            getDisplayText(sentence, stateManager, textScope, [
              "character",
              String(character),
            ])
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
      return [result];
    },
    Condition: ({ condition, body, elseBody }, stateManager) => {
      if (testCondition(condition, stateManager)) {
        return runScript(body, stateManager);
      } else {
        return runScript(elseBody, stateManager);
      }
    },
    OpenOverlay: (statement, stateManager) => {
      stateManager.updateState((state) => ({
        ...state,
        overlayStack: state.overlayStack.concat(statement.overlayId),
      }));
      return null;
    },
    CloseOverlay: ({ overlayId }, stateManager) => {
      stateManager.updateState(
        produce((draft) => {
          draft.overlayStack = draft.overlayStack.filter(
            (id) => id !== overlayId
          );
        })
      );
      return null;
    },
  };

  return statementMap[statementType] as (
    statement: K,
    stateManager: GameStateManager<Game>
  ) => DisplayInfo<Game>[];
};

export const runScript = <Game extends GameWorld>(
  script: ScriptAST<Game>,
  stateManager: GameStateManager<Game>
): DisplayInfo<Game>[] => {
  const result: DisplayInfo<Game>[] = [];
  for (const statement of script) {
    if (stateManager.isAborting()) {
      return result;
    }
    const handler = statementHandler<Game, ScriptStatement<Game>>(
      statement.statementType
    );
    const statementResult = handler(statement, stateManager);
    if (statementResult !== null) {
      result.push(...statementResult);
    }
  }
  return result;
};
