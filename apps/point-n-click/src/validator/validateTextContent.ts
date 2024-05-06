import {
  getDisplayText,
  getTranslationScope,
  isParseError,
  isStateError,
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
import { ValidationMessage } from "./ValidationMessage";

type TextReport = {
  messages: ValidationMessage[];
  lines: number;
  translated: number;
};

const mergeReport = (source: TextReport, additions: TextReport): void => {
  source.messages.push(...additions.messages);
  source.translated += additions.translated;
  source.lines += additions.lines;
};

const createBlankReport = (): TextReport => ({
  messages: [],
  translated: 0,
  lines: 0,
});

const checkGroup = <Game extends GameWorld>(
  group: TranslationFile,
  path: ValidationMessage["location"],
  gameModel: GameModel<Game>,
  stateManager: GameStateManager<Game>
): TextReport => {
  const report = createBlankReport();

  for (const key in group) {
    const translations = group[key];
    if (typeof translations === "string") {
      report.lines++;
      if (translations !== key) {
        report.translated++;
      } else {
        report.messages.push({
          message: "Line is not translated",
          messageType: "info",

          line: translations,

          location: path,
          source: "translationCheck",
        });
      }
      if (key.startsWith("DELETED ")) {
        report.messages.push({
          message: "Line is outdated",
          messageType: "info",

          line: translations,
          location: path,

          source: "textOutdatedCheck",
        });
      }
      try {
        const translationPath = ["characters", path.slice(-1)[0].value];
        getDisplayText(
          translations,
          stateManager,
          gameModel,
          [],
          translationPath
        );
      } catch (e) {
        if (isParseError(e)) {
          report.messages.push({
            message: `ParseError: ${e.found} found`,
            messageType: "error",
            startPos: e.location.start.offset,

            line: translations,
            location: path,
            source: "textParseError",
          });
        }
        if (isStateError(e)) {
          /**
           * Items are defined in types, but not in the state,
           * and can therefor not fully be verified yet.
           */
          if (e.stateKey.split(".")[0] !== "items") {
            report.messages.push({
              message: `Unknown state key: ${e.stateKey}`,
              messageType: "error",

              line: translations,
              location: path,
              source: "stateError",
            });
          }
        }
      }
    } else {
      const subReport = checkGroup(
        translations,
        path.concat({ type: "key", value: key }),
        gameModel,
        stateManager
      );
      mergeReport(report, subReport);
    }
  }

  return report;
};

export const validateTextContent = async <Game extends GameWorld>(
  translations: TranslationFile,
  gameModel: GameModel<Game>,
  location: ValidationMessage["location"] = []
): Promise<ValidationMessage[]> => {
  const report = createBlankReport();

  const state = createDefaultState(gameModel);
  const stateManager = createState(state);

  // Check locations
  mergeReport(
    report,
    checkGroup(
      translations["locations"] as TranslationFile,
      location.concat([{ type: "key", value: "locations" }]),
      gameModel,
      stateManager
    )
  );

  // Check overlays
  mergeReport(
    report,
    checkGroup(
      translations["overlays"] as TranslationFile,
      location.concat([{ type: "key", value: "overlays" }]),
      gameModel,
      stateManager
    )
  );

  // Misc
  mergeReport(
    report,
    checkGroup(
      translations["prompts"] as TranslationFile,
      location.concat([{ type: "key", value: "prompts" }]),
      gameModel,
      stateManager
    )
  );

  const gi = getTranslationScope(translations, ["global", "interactions"]) as {
    [key: string]: { label: string };
  };
  const actionsAsMap = Object.fromEntries(
    Object.entries(gi).map(([key, value]) => [key, value.label])
  );
  mergeReport(
    report,
    checkGroup(
      actionsAsMap,
      location.concat([
        { type: "key", value: "global" },
        { type: "key", value: "interactions" },
      ]),
      gameModel,
      stateManager
    )
  );
  report.messages.push({
    message: "Total lines",
    messageValue: report.lines,
    messageType: "info",
    location,
    source: "textStatsLines",
  });
  report.messages.push({
    message: "Translated lines",
    messageValue: report.translated,
    messageType: "info",
    location,
    source: "textStatsTranslatedLines",
  });
  report.messages.push({
    message: "Translation complete",
    messageValue: report.translated / report.lines,
    messageType: "info",
    location,
    source: "textStatsTranslatedPercentage",
  });

  return report.messages;
};

export const validateExternalTextContent = async <Game extends GameWorld>(
  baseTranslations: TranslationFile,
  gameModel: GameModel<Game>,
  locale: Locale
): Promise<ValidationMessage[]> => {
  const runRoot = process.cwd();
  const relativeFilePath = join("src", "translations", `${locale}.json`);
  const translationFilePath = join(runRoot, relativeFilePath);
  if (!existsSync(translationFilePath)) {
    const report = createBlankReport();
    report.messages.push({
      message: "Translation file missing",
      messageType: "error",
      location: [{ type: "file", value: relativeFilePath }],
      source: "externalTranslationCheck",
    });
    return report.messages;
  }
  const data = await readFile(translationFilePath, { encoding: "utf-8" });

  const translationData = JSON.parse(data) as unknown as TranslationFile;
  const checkTranslations = mergeTranslations(
    baseTranslations,
    translationData
  );

  return validateTextContent(checkTranslations, gameModel, [
    { type: "file", value: relativeFilePath },
  ]);
};
