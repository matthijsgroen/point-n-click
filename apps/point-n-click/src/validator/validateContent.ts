import { progressSpinner } from "../cli-utils/spinner";
import { buildContent } from "../content-builder/contentBuilder";
import { generateTranslationFile } from "../translations/generateTranslationFile";

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
  console.log("\rBuilt content ✅");
  console.log("Title: ", gameContent?.settings.gameTitle, "\n");

  console.log("Checking language text content:");
  const translatableContent = await progressSpinner(
    "Collecting translatable text content ...",
    generateTranslationFile(gameContent, resolver)
  );
  console.log("\rCollected translatable text content ✅");

  //   console.log(translatableContent);
  return true;
};
