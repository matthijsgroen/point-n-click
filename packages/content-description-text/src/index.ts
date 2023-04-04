import {
  ContentPlugin,
  ContentStatement,
  GameWorld,
  SystemInterface,
} from "@point-n-click/types";
import { FormattedText, handleTextContent } from "@point-n-click/engine";

const PLUGIN_SOURCE = "descriptionText" as const;

type TextStatement = {
  statementType: "descriptionText";
  content: string[];
};

type TextContent = {
  type: "descriptionText";
  pluginSource: typeof PLUGIN_SOURCE;
  text: FormattedText[];
};

const isTextStatement = (item: ContentStatement): item is TextStatement =>
  item.statementType === "descriptionText";

const textDslFunctions = {
  descriptionText: (system: SystemInterface, ...sentences: string[]) => {
    system.addPluginContent({
      statementType: "descriptionText",
      content: sentences,
    });
  },
} as const;

const textContent: ContentPlugin<typeof textDslFunctions> = {
  pluginType: PLUGIN_SOURCE,
  dslFunctions: textDslFunctions,
  translationContent: (content) => {
    const translationScope = {
      descriptionText: {},
    };
    for (const statement of content) {
      if (isTextStatement(statement)) {
        for (const sentence of statement.content) {
          translationScope.descriptionText[sentence] = sentence;
        }
      }
    }
    return translationScope;
  },
  handleContent: (statement, stateManager) => {
    if (isTextStatement(statement)) {
      const result: TextContent = {
        type: "descriptionText",
        pluginSource: PLUGIN_SOURCE,
        text: [],
      };
      const content = handleTextContent(
        stateManager,
        statement.content,
        "descriptionText"
      );

      result.text = content.result;
      if (content.error) {
        return [result, content.error];
      }

      return [result];
    }
    return [];
  },
};

export default textContent;
