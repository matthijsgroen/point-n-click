import produce from "immer";
import { ScriptAST, ScriptStatement } from "../dsl/ast-types";
import { GameState, GameStateManager } from "../engine/state/types";
import { testCondition } from "../engine/state/testCondition";
import { GameWorld } from "../dsl/world-types";
import { describeLocation } from "./describeLocation";
import { handleOverlay } from "./handleOverlay";
import { getDisplayText } from "../engine/text/processText";
import { getSettings } from "./settings";
import { resetStyling, setColor } from "./utils";
import { renderText } from "./renderText";
import { determineTextScope } from "../engine/text/determineTextScope";
import { FormattedText } from "../engine/text/types";
import { GameModelManager } from "../engine/model/gameModel";

type StatementMap<Game extends GameWorld> = {
  [K in ScriptStatement<Game> as K["statementType"]]: (
    statement: K,
    gameModelManager: GameModelManager<Game>,
    stateManager: GameStateManager<Game>
  ) => Promise<void> | void;
};

const statementHandler = <
  Game extends GameWorld,
  K extends ScriptStatement<Game>
>(
  statementType: K["statementType"]
): ((
  statement: K,
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => Promise<void> | void) => {
  const statementMap: StatementMap<Game> = {
    Text: async (statement, gameModelManager, stateManager) => {
      const useColor = getSettings().color;
      const color = useColor
        ? gameModelManager.getModel().settings.defaultTextColor
        : undefined;

      const textScope = determineTextScope(stateManager, "text");

      for (const sentence of statement.sentences) {
        const text = getDisplayText(
          sentence,
          stateManager,
          textScope,
          textScope
        );
        const cpm = stateManager.getState().settings.cpm;
        await renderText(text, cpm, { color });
      }

      if (color) {
        resetStyling();
      }
      console.log("");
    },
    Travel: ({ destination }, _gameModelManager, stateManager) => {
      stateManager.updateState((state) => ({
        ...state,
        currentLocation: destination,
      }));
    },
    UpdateItemState: (
      { stateItem, newState },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          const item = (draft as GameState<Game>).items[stateItem];
          if (item) {
            item.state = newState;
          } else {
            (draft as GameState<Game>).items[stateItem] = {
              state: newState,
              flags: {},
            };
          }
        })
      );
    },
    UpdateItemFlag: (
      { stateItem, flag, value },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          const item = (draft as GameState<Game>).items[stateItem];
          if (item) {
            item.flags[String(flag)] = value;
          } else {
            (draft as GameState<Game>).items[stateItem] = {
              state: "unknown",
              flags: { [String(flag)]: value },
            };
          }
        })
      );
    },
    UpdateCharacterState: (
      { stateItem, newState },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          (draft as GameState<Game>).characters[stateItem].state = newState;
        })
      );
    },
    UpdateCharacterFlag: (
      { stateItem, flag, value },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          (draft as GameState<Game>).characters[stateItem].flags[String(flag)] =
            value;
        })
      );
    },
    UpdateCharacterName: (
      { character, newName },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          (draft as GameState<Game>).characters[character].name = newName;
        })
      );
    },
    UpdateLocationState: (
      { stateItem, newState },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          (draft as GameState<Game>).locations[stateItem].state = newState;
        })
      );
    },
    UpdateLocationFlag: (
      { stateItem, flag, value },
      _gameModelManager,
      stateManager
    ) => {
      stateManager.updateState(
        produce((draft) => {
          (draft as GameState<Game>).locations[stateItem].flags[String(flag)] =
            value;
        })
      );
    },
    CharacterSay: async (
      { character, sentences },
      gameModelManager,
      stateManager
    ) => {
      const name =
        stateManager.getState().characters[character]?.name ??
        gameModelManager.getModel().settings.characterConfigs[character]
          .defaultName;

      const useColor = getSettings().color;
      const color = useColor
        ? gameModelManager.getModel().settings.characterConfigs[character]
            .textColor
        : undefined;

      const textScope = determineTextScope(stateManager, String(character));

      for (const index in sentences) {
        let text: FormattedText = [];
        if (Number(index) === 0) {
          text.push({ type: "text", text: `${name}: "` });
        } else {
          text.push({ type: "text", text: "  " });
        }

        text.push(
          ...getDisplayText(sentences[index], stateManager, textScope, [
            "character",
            String(character),
          ])
        );

        if (Number(index) === sentences.length - 1) {
          text.push({ type: "text", text: '"' });
        }
        const cpm = stateManager.getState().settings.cpm;
        await renderText(text, cpm, { color });
      }
      console.log("");
      if (useColor && color) {
        resetStyling();
      }
    },
    Condition: async (
      { condition, body, elseBody },
      gameModelManager,
      stateManager
    ) => {
      if (testCondition(condition, stateManager)) {
        await runScript(body, gameModelManager, stateManager);
      } else {
        await runScript(elseBody, gameModelManager, stateManager);
      }
    },
    OpenOverlay: async (statement, gameModelManager, stateManager) => {
      await handleOverlay(statement.overlayId, gameModelManager, stateManager);
      if (stateManager.isAborting()) {
        return;
      }
      if (stateManager.getState().overlayStack.length === 0) {
        await describeLocation(gameModelManager, stateManager);
      }
    },
    CloseOverlay: ({ overlayId }, _gameModelManager, stateManager) => {
      stateManager.updateState(
        produce((draft) => {
          draft.overlayStack = draft.overlayStack.filter(
            (id) => id !== overlayId
          );
        })
      );
    },
  };

  return statementMap[statementType] as (
    statement: K,
    gameModelManager: GameModelManager<Game>,
    stateManager: GameStateManager<Game>
  ) => Promise<void> | void;
};

export const runScript = async <Game extends GameWorld>(
  script: ScriptAST<Game>,
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
) => {
  for (const statement of script) {
    if (stateManager.isAborting()) {
      return;
    }
    const handler = statementHandler<Game, ScriptStatement<Game>>(
      statement.statementType
    );
    await handler(statement, gameModelManager, stateManager);
  }
};
