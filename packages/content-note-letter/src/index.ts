import {
  ContentPlugin,
  ContentStatement,
  Script,
  SystemInterface,
} from "@point-n-click/types";

const PLUGIN_SOURCE = "notesAndLetters" as const;

type TextBoxAST = {
  statementType: "TextBox";
  decoration: "Note";
  decorationPosition: "start" | "end";
};

type TextBoxDisplay = {
  type: "TextBox";
  pluginSource: typeof PLUGIN_SOURCE;
  decoration: "Note";
  decorationPosition: "start" | "end";
};

const isTextBoxStatement = (item: ContentStatement): item is TextBoxAST =>
  item.statementType === "TextBox";

const textDslFunctions = {
  note: (system: SystemInterface, script: Script) => {
    system.addPluginContent<TextBoxAST>({
      statementType: "TextBox",
      decoration: "Note",
      decorationPosition: "start",
    });
    system.addScript(script);
    system.addPluginContent<TextBoxAST>({
      statementType: "TextBox",
      decoration: "Note",
      decorationPosition: "end",
    });
  },
} as const;

const textContent: ContentPlugin<typeof textDslFunctions> = {
  pluginType: PLUGIN_SOURCE,
  dslFunctions: textDslFunctions,
  translationContent: () => ({}),
  handleContent: (statement) => {
    if (isTextBoxStatement(statement)) {
      const result: TextBoxDisplay = {
        type: "TextBox",
        pluginSource: PLUGIN_SOURCE,
        decoration: statement.decoration,
        decorationPosition: statement.decorationPosition,
      };

      return [result];
    }
    return [];
  },
};

export default textContent;
