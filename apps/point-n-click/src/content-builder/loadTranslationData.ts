/// <reference types="node" />
import { readFile } from "fs/promises";
import { join } from "path";
import { updateTranslation } from "@point-n-click/engine";
import { TranslationFile } from "@point-n-click/types";

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

      updateTranslation({ translationData });
    } catch (e) {}
  }
  return translationData;
};
