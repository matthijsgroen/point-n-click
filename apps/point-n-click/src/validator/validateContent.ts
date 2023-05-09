import { progressSpinner } from "../cli-utils/spinner";
import { buildContent } from "../content-builder/contentBuilder";
import { generateTranslationFile } from "../translations/generateTranslationFile";
import { validateTextContent } from "./validateTextContent";

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

  // TODO: Check external language files

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
