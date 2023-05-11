import { Locale } from "@point-n-click/types";
import { progressSpinner } from "../cli-utils/spinner";
import { buildContent } from "../content-builder/contentBuilder";
import { generateTranslationFile } from "../translations/generateTranslationFile";
import {
  TextValidationReport,
  validateExternalTextContent,
  validateTextContent,
} from "./validateTextContent";
import { isLocale } from "../translations/exportTranslations";

export const validateContent = async (
  source: string,
  { resolver }: { resolver: (packageName: string) => string }
): Promise<boolean> => {
  let hasErrors = false;
  const gameContent = await progressSpinner(
    "Building content...",
    buildContent(source, { resolver })
  );
  if (gameContent === undefined) {
    console.log("Building content failed ❌");
    process.exit(1);
  }

  const translatableContent = await progressSpinner(
    "Collecting translatable text content ...",
    generateTranslationFile(gameContent, resolver)
  );

  const report = await progressSpinner(
    "Validating default text content ...",
    validateTextContent(translatableContent, gameContent)
  );

  const supportedExternalLocales = Object.keys(
    gameContent.settings.locales.supported
  ).filter(
    (l): l is Locale =>
      l !== gameContent.settings.locales.default && isLocale(l)
  );

  const languageReports: Record<Locale, TextValidationReport> = {};
  for (const externalLocale of supportedExternalLocales) {
    const langReport = await progressSpinner(
      `Validating ${externalLocale} text content ...`,
      validateExternalTextContent(
        translatableContent,
        gameContent,
        externalLocale
      )
    );
    languageReports[externalLocale] = langReport;
    if (langReport.totalLines === 0) {
      console.log("Translation %s: File missing", externalLocale);
    } else {
      const summaryMessages: string[] = [];

      const addSum = (
        type: TextValidationReport["messages"][number]["type"],
        suffix: string
      ) => {
        const amount = langReport.messages.filter(
          (m) => m.type === type
        ).length;
        if (amount === 0) return;
        summaryMessages.push(`${amount} ${suffix}${amount > 1 ? "s" : ""}`);
      };

      addSum("outdatedTranslation", "outdated line");
      addSum("parsingError", "parse error");
      addSum("stateError", "state error");

      console.log(
        "Translation %s: %i / %i (%s%%)",
        externalLocale,
        langReport.totalTranslated,
        langReport.totalLines,
        ((langReport.totalTranslated / langReport.totalLines) * 100).toFixed(2),
        summaryMessages.length > 0 ? `, ${summaryMessages.join(", ")}` : ""
      );
    }
  }

  const languageErrorReport = (
    report: TextValidationReport,
    languageName: string
  ) => {
    const parseErrors = report.messages.filter(
      (m) => m.type === "parsingError"
    );
    const stateErrors = report.messages.filter((m) => m.type === "stateError");
    if (parseErrors.length > 0 || stateErrors.length > 0) {
      hasErrors = true;
      console.log(
        "%d errors in the %s language:",
        parseErrors.length + stateErrors.length,
        languageName
      );
      parseErrors.forEach((error) => {
        console.log(`parse error in: ["${error.key.join('","')}"]`);
      });
      stateErrors.forEach((error) => {
        console.log(`state error in: ["${error.key.join('","')}"]`);
      });
    }
  };

  languageErrorReport(report, "default");
  for (const [lang, report] of Object.entries(languageReports)) {
    languageErrorReport(report, lang);
  }

  console.log(hasErrors ? "Done with errors ❌" : "Done ✅");
  return !hasErrors;
};
