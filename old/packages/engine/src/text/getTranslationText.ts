import { TranslationFile } from "@point-n-click/types";
import { getTranslation } from "../translations";

export const getTranslationText = (
  scope: string[],
  key: string
): string | undefined => {
  const translationScope = getTranslationScope(
    getTranslation().translationData,
    scope
  );
  if (!translationScope) return undefined;

  const value = translationScope[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
};

export const getTranslationScope = (
  source: TranslationFile | undefined,
  scope: string[]
): TranslationFile | undefined => {
  if (!source) return undefined;
  let translationScope = source;
  for (const key of scope) {
    const value = translationScope[key];
    if (typeof value !== "string") {
      translationScope = value;
      if (!translationScope) {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  return translationScope;
};
