import {
  DEFAULT_ACTION_PROMPT,
  getContentPlugin,
  isContentPluginStatement,
} from "@point-n-click/engine";
import {
  ConditionElse,
  ConditionStatement,
  ContentPluginStatement,
  GameModel,
  GameWorld,
  ScriptAST,
  TranslationFile,
} from "@point-n-click/types";

const applyTranslations = (
  translations: TranslationFile,
  translationKey: string[],
  setTranslationKey: (key: string[], value: string) => void
) => {
  for (const [key, value] of Object.entries(translations)) {
    if (typeof value === "string") {
      setTranslationKey(translationKey.concat(key), value);
    } else {
      applyTranslations(value, translationKey.concat(key), setTranslationKey);
    }
  }
};

const processScript = <Game extends GameWorld>(
  script: ScriptAST<Game>,
  enterScriptScope: string[],
  setTranslationKey: (key: string[], value: string) => void
) => {
  const contentPluginStatementsPerSource: Record<
    string,
    ContentPluginStatement[]
  > = {};

  for (const statement of script) {
    if (isContentPluginStatement(statement)) {
      contentPluginStatementsPerSource[statement.source] =
        contentPluginStatementsPerSource[statement.source] || [];
      contentPluginStatementsPerSource[statement.source].push(statement);

      continue;
    }
    if (statement.statementType === "Text") {
      for (const sentence of statement.sentences) {
        setTranslationKey(enterScriptScope.concat("text", sentence), sentence);
      }
    }
    if (statement.statementType === "CharacterSay") {
      for (const sentence of statement.sentences) {
        setTranslationKey(
          enterScriptScope.concat(String(statement.character), sentence),
          sentence
        );
      }
    }
    if (
      statement.statementType === "UpdateCharacterName" &&
      statement.translatable &&
      statement.newName
    ) {
      setTranslationKey(
        ["characters", String(statement.character), "names", statement.newName],
        statement.newName
      );
    }
    if (statement.statementType === "Condition") {
      const exportBody = (
        testStatement:
          | ConditionStatement<Game>
          | ConditionElse<Game>
          | { body: ScriptAST<Game> }
      ) => {
        processScript(testStatement.body, enterScriptScope, setTranslationKey);
        if ("else" in testStatement && testStatement.else) {
          exportBody(testStatement.else);
        }
      };
      exportBody(statement);
    }
    if (statement.statementType === "SetGameObjectText") {
      setTranslationKey(
        [
          statement.objectType,
          String(statement.stateItem),
          "texts",
          statement.name!,
          statement.text,
        ],
        statement.text
      );
    }
    if (statement.statementType === "DisplayList") {
      Object.values(statement.values).forEach((script) => {
        processScript(
          script as ScriptAST<Game>,
          enterScriptScope,
          setTranslationKey
        );
      });
    }
  }
  for (const source in contentPluginStatementsPerSource) {
    const plugin = getContentPlugin(source);
    if (plugin && plugin.translationContent) {
      const result = plugin.translationContent(
        contentPluginStatementsPerSource[source]
      );
      applyTranslations(result, enterScriptScope, setTranslationKey);
    }
  }
};
export const generateTranslationFile = async <Game extends GameWorld>(
  gameModel: GameModel<Game>,
  resolver: (packageName: string) => string
): Promise<TranslationFile> => {
  const translationObject: TranslationFile = {};
  const setTranslationKey = (key: string[], value: string) => {
    if (value === "") return;
    let obj = translationObject;
    const path = key.slice(0, -1);
    const tail = key.slice(-1)[0];
    for (const prop of path) {
      obj[prop] = obj[prop] || {};
      obj = obj[prop] as TranslationFile;
    }
    obj[tail] = value;
  };
  setTranslationKey(["title"], gameModel.settings.gameTitle);

  const author = gameModel.settings.meta?.author;
  if (author) {
    setTranslationKey(["meta", "author"], author);
  }
  const credits = gameModel.settings.meta?.credits ?? [];
  for (const credit of credits) {
    setTranslationKey(["meta", "credits", credit.role], credit.role);
  }
  const themes = gameModel.themes ?? [];
  for (const theme of themes) {
    setTranslationKey(["meta", "themes", theme.name], theme.name);
  }

  setTranslationKey(
    ["settings", "defaultActionPrompt"],
    gameModel.settings.defaultActionPrompt ?? DEFAULT_ACTION_PROMPT
  );
  for (const [character, settings] of Object.entries(
    gameModel.settings.characterConfigs
  )) {
    setTranslationKey(
      ["characters", character, "defaultName"],
      settings.defaultName
    );
  }

  for (const location of gameModel.locations) {
    const locationScope = ["locations", String(location.id)];
    for (const enterScript of location.onEnter) {
      processScript(enterScript.script, locationScope, setTranslationKey);
    }
    for (const leaveScript of location.onLeave) {
      processScript(leaveScript.script, locationScope, setTranslationKey);
    }
    processScript(location.describe.script, locationScope, setTranslationKey);

    for (const interaction of location.interactions) {
      const interactionScope = locationScope.concat(
        "interactions",
        interaction.label
      );
      setTranslationKey(interactionScope, interaction.label);
      processScript(interaction.script, locationScope, setTranslationKey);
    }
    if (location.prompt) {
      setTranslationKey(["prompts", location.prompt], location.prompt);
    }
  }

  for (const overlay of gameModel.overlays) {
    const overlayScope = ["overlays", String(overlay.id)];
    processScript(overlay.onEnter.script, overlayScope, setTranslationKey);
    processScript(overlay.onLeave.script, overlayScope, setTranslationKey);
    for (const interaction of overlay.interactions) {
      setTranslationKey(
        overlayScope.concat("interactions", interaction.label),
        interaction.label
      );
      processScript(interaction.script, overlayScope, setTranslationKey);
    }
    if (overlay.prompt) {
      setTranslationKey(["prompts", overlay.prompt], overlay.prompt);
    }
  }
  for (const globalInteraction of gameModel.globalInteractions) {
    const overlayScope = [
      "global",
      "interactions",
      String(globalInteraction.label),
    ];
    setTranslationKey(overlayScope.concat("label"), globalInteraction.label);
    if (globalInteraction.shortcutKey) {
      setTranslationKey(
        overlayScope.concat("shortcutKey"),
        globalInteraction.shortcutKey
      );
    }
    processScript(globalInteraction.script, overlayScope, setTranslationKey);
  }
  for (const theme of gameModel.themes || []) {
    const resolvedPackage = resolver(theme.themePackage);
    const themePluginLib = await import(resolvedPackage);
    const themePlugin = themePluginLib.default.default(
      theme.name,
      theme.settings
    );
    const content = themePlugin.getTextContent();
    applyTranslations(
      content,
      ["themes", theme.themePackage],
      setTranslationKey
    );
  }
  return translationObject;
};
