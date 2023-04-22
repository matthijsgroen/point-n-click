import {
  ContentPlugin,
  ContentStatement,
  FormattedText,
  GameWorld,
  SystemInterface,
} from "@point-n-click/types";
import { characterName, handleTextContent } from "@point-n-click/engine";

const PLUGIN_SOURCE = "characterRename" as const;

type CharacterRenameAST<Game extends GameWorld> = {
  statementType: "CharacterRename";
  character: keyof Game["characters"];
  currentName?: string;
  prompt: string;
};

type CharacterRenameDisplay = {
  type: "CharacterRename";
  pluginSource: typeof PLUGIN_SOURCE;
  character: string;
  currentName: string;
  prompt: FormattedText;
};

const isCharacterRename = (
  item: ContentStatement
): item is CharacterRenameAST<GameWorld> =>
  item.statementType === "CharacterRename";

const textDslFunctions = {
  character:
    (system: SystemInterface) =>
    <Game extends GameWorld>(character: keyof Game["characters"]) => ({
      renameByPlayer: (prompt = "New name for character:") => {
        system.addPluginContent<CharacterRenameAST<Game>>({
          statementType: "CharacterRename",
          character,
          currentName: undefined,
          prompt,
        });
      },
    }),
} as const;

const textContent: ContentPlugin<typeof textDslFunctions> = {
  pluginType: PLUGIN_SOURCE,
  dslFunctions: textDslFunctions,
  translationContent: (content) => {
    const translationScope = {
      renamePrompt: {},
    };
    for (const statement of content) {
      if (isCharacterRename(statement)) {
        translationScope.renamePrompt[statement.prompt] = statement.prompt;
      }
    }
    return translationScope;
  },
  handleContent: (statement, stateManager, gameModel) => {
    if (isCharacterRename(statement)) {
      const result: CharacterRenameDisplay = {
        type: "CharacterRename",
        pluginSource: PLUGIN_SOURCE,
        character: statement.character,
        currentName: characterName(
          statement.character,
          stateManager.getState(),
          gameModel
        ),
        prompt: [],
      };
      const content = handleTextContent(
        stateManager,
        gameModel,
        [statement.prompt],
        "renamePrompt"
      );

      result.prompt = content.result[0];
      if (content.error) {
        return [result, content.error];
      }

      return [result];
    }
    return [];
  },
};

export default textContent;
