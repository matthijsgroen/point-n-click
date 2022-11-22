import {
  ContentPlugin,
  ContentStatement,
  SystemInterface,
} from "@point-n-click/types";

type TextStatement = {
  statementType: "descriptionText";
  content: string[];
};

const isTextStatement = (item: ContentStatement): item is TextStatement =>
  item.statementType === "descriptionText";

const textDslFunctions = {
  descriptionText: (system: SystemInterface, ...sentences: string[]) => {
    system.addContent({ statementType: "descriptionText", content: sentences });
  },
} as const;

const textContent: ContentPlugin<typeof textDslFunctions> = {
  pluginType: "descriptionText",
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
  handleContent: (content, stateManager) => {
    return [];
  },
};

export default textContent;
