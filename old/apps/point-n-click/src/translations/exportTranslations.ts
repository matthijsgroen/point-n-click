import {
  GameModel,
  GameWorld,
  Locale,
  TranslationFile,
} from "@point-n-click/types";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { mergeTranslations } from "./mergeTranslations";
import { generateTranslationFile } from "./generateTranslationFile";

export const isLocale = (item: unknown): item is Locale =>
  !!(typeof item === "string" && item.match(/^\w{2}-\w{2}$/));

export const exportTranslations = async <Game extends GameWorld>(
  folder: string,
  resolver: (packageName: string) => string,
  locales: Locale[],
  gameModel: GameModel<Game>
) => {
  const translationObject = await generateTranslationFile(gameModel, resolver);

  try {
    await mkdir(folder);
  } catch (e) {
    if (
      "code" in (e as Error) &&
      (e as Error & { code: string }).code === "EEXIST"
    ) {
      // no problem
    } else {
      throw e;
    }
  }
  for (const locale of locales) {
    const filePath = join(folder, `${locale}.json`);
    let existingTranslations: TranslationFile = {};

    try {
      const fileData = await readFile(filePath, {
        encoding: "utf-8",
      });
      if (fileData) {
        existingTranslations = JSON.parse(fileData);
      }
    } catch (e) {}

    const mergedTranslations = mergeTranslations(
      translationObject,
      existingTranslations
    );

    await writeFile(filePath, JSON.stringify(mergedTranslations, undefined, 2));
  }
};
