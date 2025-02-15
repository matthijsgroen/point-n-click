import { settings } from "./settings";
import type { TranslationFile } from "@point-n-click/types";

export type TranslationSettings = {
  translationData?: TranslationFile;
};

const translationSettings = settings<TranslationSettings>({});

export const getTranslation = translationSettings.get;
export const updateTranslation = translationSettings.update;
