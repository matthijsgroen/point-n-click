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
      console.log(
        "Translation %s: %i / %i (%s%%), %i lines outdated",
        externalLocale,
        langReport.totalTranslated,
        langReport.totalLines,
        ((langReport.totalTranslated / langReport.totalLines) * 100).toFixed(2),
        langReport.totalOutdated
      );
    }
  }

  const parseErrors = report.messages.filter((m) => m.type === "parsingError");

  if (parseErrors.length > 0) {
    console.log(
      "There were %d parse errors in the default language:",
      parseErrors.length
    );
    parseErrors.forEach((error) => {
      console.log(`["${error.key.join('","')}"]`);
    });

    console.log("Done with errors ❌");
    return false;
  }
  console.log("Done ✅");
  return true;
};
