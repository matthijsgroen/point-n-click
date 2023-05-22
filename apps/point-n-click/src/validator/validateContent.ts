import { Locale } from "@point-n-click/types";
import { progressSpinner } from "../cli-utils/spinner";
import { buildContent } from "../content-builder/contentBuilder";
import { generateTranslationFile } from "../translations/generateTranslationFile";
import {
  validateExternalTextContent,
  validateTextContent,
} from "./validateTextContent";
import { isLocale } from "../translations/exportTranslations";
import { validateJumpPoints } from "./validateJumpPoints";
import { ValidationMessage } from "./ValidationMessage";

const progressWithReport = async (
  message: string,
  task: Promise<ValidationMessage[]>
): Promise<ValidationMessage[]> => {
  const report = await progressSpinner(message, task);
  const errorCount = report.filter((m) => m.messageType === "error").length;
  const warningCount = report.filter((m) => m.messageType === "warning").length;
  if (errorCount > 0) {
    console.log(`${message} ❌`);
  } else if (warningCount > 0) {
    console.log(`${message} ⚠️`);
  } else {
    console.log(`${message} ️✔`);
  }

  return report;
};

const formatLocation = (location: ValidationMessage["location"]) =>
  location
    .map((node, i, l) =>
      node.type === "file"
        ? `${node.value} `
        : `${node.value}${i === l.length - 1 ? "" : "."}`
    )
    .join("");

const displayMessage = (message: ValidationMessage) => {
  const icon = {
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };
  let value = "";
  if (message.messageValue) {
    value = `${message.messageValue} `;
    if (message.source === "textStatsTranslatedPercentage") {
      value = `${(message.messageValue * 100).toFixed(2)}% `;
    }
  }

  console.log(
    `${icon[message.messageType]} ${value}${
      message.message
    } in ${formatLocation(message.location)}`
  );
  if (message.line) {
    console.log(`  ${message.line}`);
    if (message.startPos) {
      console.log(`  ${Array(message.startPos).fill(" ").join("")}^`);
    }
  }
};

const displayMessages = (
  messages: ValidationMessage[],
  filter: (m: ValidationMessage) => boolean
) => messages.filter(filter).forEach((m) => displayMessage(m));

export const validateContent = async (
  source: string,
  { resolver }: { resolver: (packageName: string) => string }
): Promise<boolean> => {
  let hasErrors = false;
  const gameContent = await progressSpinner(
    "Building content ...",
    buildContent(source, { resolver })
  );
  if (gameContent === undefined) {
    console.log("Building content ... ❌");
    process.exit(1);
  }

  const jumpPointReport = await progressWithReport(
    "Validating locations and overlays ...",
    validateJumpPoints(gameContent)
  );
  displayMessages(
    jumpPointReport,
    (m) => m.messageType === "error" || m.messageType === "warning"
  );

  const translatableContent = await progressSpinner(
    "Collecting translatable text content ...",
    generateTranslationFile(gameContent, resolver)
  );

  const report = await progressWithReport(
    "Validating default text content ...",
    validateTextContent(translatableContent, gameContent)
  );
  displayMessages(report, (m) => m.messageType === "error");

  const supportedExternalLocales = Object.keys(
    gameContent.settings.locales.supported
  ).filter(
    (l): l is Locale =>
      l !== gameContent.settings.locales.default && isLocale(l)
  );

  const languageReports: Record<Locale, ValidationMessage[]> = {};
  for (const externalLocale of supportedExternalLocales) {
    const langReport = await progressWithReport(
      `Validating ${externalLocale} text content ...`,
      validateExternalTextContent(
        translatableContent,
        gameContent,
        externalLocale
      )
    );
    languageReports[externalLocale] = langReport;
    displayMessages(langReport, (m) => m.messageType === "error");
    displayMessages(
      langReport,
      (m) => m.source === "textStatsTranslatedPercentage"
    );

    //   //   console.log(
    //   //     "Translation %s: %i / %i (%s%%)",
    //   //     externalLocale,
    //   //     langReport.totalTranslated,
    //   //     langReport.totalLines,
    //   //     ((langReport.totalTranslated / langReport.totalLines) * 100).toFixed(2),
    //   //     summaryMessages.length > 0 ? `, ${summaryMessages.join(", ")}` : ""
    //   //   );
    // }
  }

  console.log(hasErrors ? "Done with errors ❌" : "Done ✅");
  return !hasErrors;
};
