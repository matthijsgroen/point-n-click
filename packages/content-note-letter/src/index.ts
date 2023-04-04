import {
  ContentPlugin,
  GameWorld,
  Script,
  SystemInterface,
} from "@point-n-click/types";

const PLUGIN_SOURCE = "notesAndLetters" as const;

const textDslFunctions = {
  note: (system: SystemInterface, script: Script) => {
    system.addBaseContent({
      statementType: "ContentDecoration",
      decorationType: "note",
      content: system.wrapScript(script),
    });
  },
} as const;

const textContent: ContentPlugin<typeof textDslFunctions> = {
  pluginType: PLUGIN_SOURCE,
  dslFunctions: textDslFunctions,
  translationContent: (content) => ({}),
  handleContent: (statement, stateManager) => [],
};

export default textContent;
