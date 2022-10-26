import { GameWorld, ScriptAST } from "@point-n-click/types";
import { GameModel } from "@point-n-click/state";
import { TranslationFile, DEFAULT_ACTION_PROMPT } from "@point-n-click/engine";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";

export type Locale = `${string}-${string}`;

export const isLocale = (item: unknown): item is Locale =>
  !!(typeof item === "string" && item.match(/^\w{2}-\w{2}$/));

const processScript = <Game extends GameWorld>(
  script: ScriptAST<Game>,
  enterScriptScope: string[],
  setTranslationKey: (key: string[], value: string) => void
) => {
  for (const statement of script) {
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
};

const mergeTranslations = (
  newTranslations: TranslationFile,
  existingTranslations: TranslationFile
) => {
  const newKeys = Object.keys(newTranslations);
  const existingKeys = Object.keys(existingTranslations);

  let removedKeys = existingKeys.filter((k) => !newKeys.includes(k));
  const addedKeys = newKeys.filter((k) => !existingKeys.includes(k));
  const keptKeys = newKeys.filter((k) => existingKeys.includes(k));

  const result: TranslationFile = {};

  for (const addedKey of addedKeys) {
    const previouslyRemovedKey = `DELETED ${addedKey}`;
    if (existingTranslations[previouslyRemovedKey]) {
      result[addedKey] = existingTranslations[previouslyRemovedKey];

      removedKeys = removedKeys.filter((key) => key !== previouslyRemovedKey);
    } else {
      result[addedKey] = newTranslations[addedKey];
    }
  }
  for (const keptKey of keptKeys) {
    const value = newTranslations[keptKey];
    if (typeof value === "string") {
      result[keptKey] = existingTranslations[keptKey];
    } else {
      result[keptKey] = mergeTranslations(
        newTranslations[keptKey] as TranslationFile,
        existingTranslations[keptKey] as TranslationFile
      );
    }
  }
  for (const removedKey of removedKeys) {
    if (removedKey.startsWith("DELETED ")) {
      result[removedKey] = existingTranslations[removedKey];
    } else {
      if (removedKey !== existingTranslations[removedKey]) {
        // only keep translation if it was actually translated
        result[`DELETED ${removedKey}`] = existingTranslations[removedKey];
      }
    }
  }

  const orderedResult: TranslationFile = {};
  for (const key of newKeys) {
    orderedResult[key] = result[key];
  }
  const extraKeys = Object.keys(result).filter((k) => !newKeys.includes(k));
  for (const key of extraKeys) {
    orderedResult[key] = result[key];
  }

  return orderedResult;
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
    setTranslationKey(
      overlayScope.concat("shortcutKey"),
      globalInteraction.shortcutKey
    );
    processScript(globalInteraction.script, overlayScope, setTranslationKey);
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
