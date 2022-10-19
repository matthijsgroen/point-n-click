import { settings } from "./settings";

export type TranslationFile = {
  [key: string]: string | TranslationFile;
};

export type TranslationSettings = {
  translationData?: TranslationFile;
};

const translationSettings = settings<TranslationSettings>({});

export const getTranslation = translationSettings.get;
export const updateTranslation = translationSettings.update;
