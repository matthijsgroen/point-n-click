import {
  ContentPlugin,
  ContentStatement,
  SystemInterface,
} from "@point-n-click/types";
import { FormattedText, handleTextContent } from "@point-n-click/engine";

const PLUGIN_SOURCE = "descriptionText" as const;

type TextDescriptionAST = {
  statementType: "descriptionText";
  content: string[];
};

type TextDescriptionDisplay = {
  type: "descriptionText";
  pluginSource: typeof PLUGIN_SOURCE;
  statementClassification: "output";
  text: FormattedText[];
};

const isTextStatement = (item: ContentStatement): item is TextDescriptionAST =>
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
  handleContent: (statement, state, gameModel) => {
    if (isTextStatement(statement)) {
      const result: TextDescriptionDisplay = {
        type: "descriptionText",
        pluginSource: PLUGIN_SOURCE,
        statementClassification: "output",
        text: [],
      };
      const content = handleTextContent(
        state,
        gameModel,
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
