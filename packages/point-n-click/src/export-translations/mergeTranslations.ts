import { TranslationFile } from "@point-n-click/engine";

export const mergeTranslations = (
  newTranslations: TranslationFile,
  existingTranslations: TranslationFile
) => {
  const newKeys = Object.keys(newTranslations);
  const existingKeys = Object.keys(existingTranslations);

  let removedKeys = existingKeys.filter((k) => !newKeys.includes(k));
  const addedKeys = newKeys.filter((k) => !existingKeys.includes(k));
  const keptKeys = newKeys.filter((k) => existingKeys.includes(k));

  const result: TranslationFile = {};

  for (const addedKey of addedKeys) {
    const previouslyRemovedKey = `DELETED ${addedKey}`;
    if (existingTranslations[previouslyRemovedKey]) {
      result[addedKey] = existingTranslations[previouslyRemovedKey];

      removedKeys = removedKeys.filter((key) => key !== previouslyRemovedKey);
    } else {
      result[addedKey] = newTranslations[addedKey];
    }
  }
  for (const keptKey of keptKeys) {
    const value = newTranslations[keptKey];
    if (typeof value === "string") {
      result[keptKey] = existingTranslations[keptKey];
    } else {
      result[keptKey] = mergeTranslations(
        newTranslations[keptKey] as TranslationFile,
        existingTranslations[keptKey] as TranslationFile
      );
    }
  }
  for (const removedKey of removedKeys) {
    if (removedKey.startsWith("DELETED ")) {
      result[removedKey] = existingTranslations[removedKey];
    } else {
      if (removedKey !== existingTranslations[removedKey]) {
        // only keep translation if it was actually translated
        result[`DELETED ${removedKey}`] = existingTranslations[removedKey];
      }
    }
  }

  const orderedResult: TranslationFile = {};
  for (const key of newKeys) {
    orderedResult[key] = result[key];
  }
  const extraKeys = Object.keys(result).filter((k) => !newKeys.includes(k));
  for (const key of extraKeys) {
    orderedResult[key] = result[key];
  }

  return orderedResult;
};
