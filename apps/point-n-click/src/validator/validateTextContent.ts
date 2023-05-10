import { getTranslationScope, parseText } from "@point-n-click/engine";
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
  gameModel: GameModel<Game>
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
        parseText(translations);
      } catch (e) {
        report.messages.push({
          sentence: translations,
          key: path.concat(key),
          type: "parsingError",
        });
      }
    } else {
      checkGroup(translations, report, path.concat(key), gameModel);
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

  // Check locations
  checkGroup(
    translations["locations"] as TranslationFile,
    report,
    ["locations"],
    gameModel
  );

  // Check overlays
  checkGroup(
    translations["overlays"] as TranslationFile,
    report,
    ["overlays"],
    gameModel
  );

  // Misc
  checkGroup(
    translations["prompts"] as TranslationFile,
    report,
    ["prompts"],
    gameModel
  );

  const gi = getTranslationScope(translations, ["global", "interactions"]) as {
    [key: string]: { label: string };
  };
  const actionsAsMap = Object.fromEntries(
    Object.entries(gi).map(([key, value]) => [key, value.label])
  );
  checkGroup(actionsAsMap, report, ["global", "interactions"], gameModel);

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
