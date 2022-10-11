import { readFile } from "fs/promises";
import { join } from "path";
import { updateSettings } from "../cli-client/settings";
import { TranslationFile } from "../export-translations/exportTranslations";

export const loadTranslationData = async (
  locale?: string
): Promise<TranslationFile | undefined> => {
  const runRoot = process.cwd();

  let translationData: TranslationFile | undefined = undefined;
  if (locale) {
    try {
      const translationFilePath = join(
        runRoot,
        "src",
        "translations",
        `${locale}.json`
      );
      const data = await readFile(translationFilePath, { encoding: "utf-8" });
      translationData = JSON.parse(data) as unknown as TranslationFile;

      updateSettings({ translationData });
    } catch (e) {}
  }
  return translationData;
};
