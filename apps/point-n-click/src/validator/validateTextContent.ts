import {
  ParseSyntaxError,
  StateError,
  getDisplayText,
  getTranslationScope,
} from "@point-n-click/engine";
import {
  GameModel,
  GameWorld,
  Locale,
  TranslationFile,
} from "@point-n-click/types";
import { readFile } from "fs/promises";
import { join } from "path";
import { mergeTranslations } from "../translations/mergeTranslations";
import { existsSync } from "fs";
import { createDefaultState } from "@point-n-click/state";
import { createState } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/types";

export type TextValidationReport = {
  messages: {
    sentence: string;
    key: string[];
    type:
      | "stateError"
      | "parsingError"
      | "outdatedTranslation"
      | "translationFileMissing"
      | "notTranslated";
  }[];

  totalLines: number;
  totalTranslated: number;
  totalOutdated: number;
};

const checkGroup = <Game extends GameWorld>(
  group: TranslationFile,
  report: TextValidationReport,
  path: string[],
  gameModel: GameModel<Game>,
  stateManager: GameStateManager<Game>
): void => {
  for (const key in group) {
    const translations = group[key];
    if (typeof translations === "string") {
      report.totalLines++;
      if (translations !== key) {
        report.totalTranslated++;
      } else {
        report.messages.push({
          sentence: translations,
          key: path.concat(key),
          type: "notTranslated",
        });
      }
      if (key.startsWith("DELETED ")) {
        report.totalOutdated++;
        report.messages.push({
          sentence: translations,
          key: path.concat(key),
          type: "outdatedTranslation",
        });
      }
      try {
        const translationPath = ["characters", path.slice(-1)[0]];
        getDisplayText(
          translations,
          stateManager,
          gameModel,
          [],
          translationPath
        );
      } catch (e) {
        if ((e as ParseSyntaxError).name === "SyntaxError") {
          report.messages.push({
            sentence: translations,
            key: path.concat(key),
            type: "parsingError",
          });
        }
        if ((e as StateError).name === "StateError") {
          if (e.stateKey.split(".")[0] !== "items") {
            report.messages.push({
              sentence: translations,
              key: path.concat(key),
              type: "stateError",
            });
          }
        }
      }
    } else {
      checkGroup(
        translations,
        report,
        path.concat(key),
        gameModel,
        stateManager
      );
    }
  }
};

const createBlankReport = (): TextValidationReport => ({
  messages: [],
  totalLines: 0,
  totalOutdated: 0,
  totalTranslated: 0,
});

export const validateTextContent = async <Game extends GameWorld>(
  translations: TranslationFile,
  gameModel: GameModel<Game>
): Promise<TextValidationReport> => {
  const report = createBlankReport();

  const state = createDefaultState(gameModel);
  const stateManager = createState(state);

  // Check locations
  checkGroup(
    translations["locations"] as TranslationFile,
    report,
    ["locations"],
    gameModel,
    stateManager
  );

  // Check overlays
  checkGroup(
    translations["overlays"] as TranslationFile,
    report,
    ["overlays"],
    gameModel,
    stateManager
  );

  // Misc
  checkGroup(
    translations["prompts"] as TranslationFile,
    report,
    ["prompts"],
    gameModel,
    stateManager
  );

  const gi = getTranslationScope(translations, ["global", "interactions"]) as {
    [key: string]: { label: string };
  };
  const actionsAsMap = Object.fromEntries(
    Object.entries(gi).map(([key, value]) => [key, value.label])
  );
  checkGroup(
    actionsAsMap,
    report,
    ["global", "interactions"],
    gameModel,
    stateManager
  );

  return report;
};

export const validateExternalTextContent = async <Game extends GameWorld>(
  baseTranslations: TranslationFile,
  gameModel: GameModel<Game>,
  locale: Locale
): Promise<TextValidationReport> => {
  const runRoot = process.cwd();
  const translationFilePath = join(
    runRoot,
    "src",
    "translations",
    `${locale}.json`
  );
  if (!existsSync(translationFilePath)) {
    const report = createBlankReport();
    report.messages.push({
      sentence: translationFilePath,
      key: [],
      type: "translationFileMissing",
    });
    return report;
  }
  const data = await readFile(translationFilePath, { encoding: "utf-8" });

  const translationData = JSON.parse(data) as unknown as TranslationFile;
  const checkTranslations = mergeTranslations(
    baseTranslations,
    translationData
  );

  return validateTextContent(checkTranslations, gameModel);
};
