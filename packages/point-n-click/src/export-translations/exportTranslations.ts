import {
  ContentPluginStatement,
  GameWorld,
  ScriptAST,
  TranslationFile,
} from "@point-n-click/types";
import { GameModel } from "@point-n-click/state";
import {
  isContentPluginStatement,
  DEFAULT_ACTION_PROMPT,
  getContentPlugin,
} from "@point-n-click/engine";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { mergeTranslations } from "./mergeTranslations";

export type Locale = `${string}-${string}`;

export const isLocale = (item: unknown): item is Locale =>
  !!(typeof item === "string" && item.match(/^\w{2}-\w{2}$/));

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
      processScript(statement.body, enterScriptScope, setTranslationKey);
      processScript(statement.elseBody, enterScriptScope, setTranslationKey);
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

export const exportTranslations = async <Game extends GameWorld>(
  folder: string,
  locales: Locale[],
  gameModel: GameModel<Game>
) => {
  const translationObject: TranslationFile = {};
  const setTranslationKey = (key: string[], value: string) => {
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
    const locationScope = ["location", String(location.id)];
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
    const themePluginLib = await import(theme.themePackage);
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

  try {
    await mkdir(folder);
  } catch (e) {
    if (
      "code" in (e as Error) &&
      (e as Error & { code: string }).code === "EEXIST"
    ) {
      // no problem
    } else {
      throw e;
    }
  }
  for (const locale of locales) {
    const filePath = join(folder, `${locale}.json`);
    let existingTranslations: TranslationFile = {};

    try {
      const fileData = await readFile(filePath, {
        encoding: "utf-8",
      });
      if (fileData) {
        existingTranslations = JSON.parse(fileData);
      }
    } catch (e) {}

    const mergedTranslations = mergeTranslations(
      translationObject,
      existingTranslations
    );

    await writeFile(filePath, JSON.stringify(mergedTranslations, undefined, 2));
  }
};
