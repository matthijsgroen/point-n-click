import { GameModelManager, getTranslation } from "@point-n-click/engine";
import { GameWorld, Locale } from "@point-n-click/types";
import { loadTranslationData } from "./loadTranslationData";
import { watch } from "fs";
import { join } from "path";

export const watchTranslations = <Game extends GameWorld>(
  locale: Locale,
  gameModelManager: GameModelManager<Game>
): AbortController => {
  const ac = new AbortController();
  const { signal } = ac;

  const fileName = join(process.cwd(), "src", "translations", `${locale}.json`);
  watch(fileName, { signal }, async () => {
    const translationBefore = getTranslation();
    await loadTranslationData(locale);
    const translationAfter = getTranslation();
    if (
      JSON.stringify(translationBefore) !== JSON.stringify(translationAfter)
    ) {
      gameModelManager.restoreModel();
    }
  });

  return ac;
};
