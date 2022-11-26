import {
  DisplayErrorText,
  getDisplayInfo,
  getInteractions,
  getRegisteredThemes,
  getTranslation,
  getTranslationScope,
} from "@point-n-click/engine";
import React, { Suspense, useMemo } from "react";
import { useGameContent, useGameState } from "./ContentProvider";
import { getClientSettings, setClientSettings } from "../settings";
import { Error } from "./Error";
import { Loading } from "./Loading";
import { TranslationFile } from "@point-n-click/types";

export const ThemeProvider: React.FC = () => {
  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  // TODO: Read from 'storage' first what active theme is
  const activeTheme = getRegisteredThemes()[0];
  const Theme = React.lazy(activeTheme.renderer);

  const translations = useMemo((): TranslationFile => {
    const defaultTranslations = activeTheme.getTextContent();
    const themeTranslations = getTranslationScope([
      "themes",
      activeTheme.packageName,
    ]);

    return {
      ...defaultTranslations,
      ...themeTranslations,
    };
  }, [
    activeTheme,
    getClientSettings().currentLocale,
    getTranslation().translationData,
  ]);

  const error = displayInfo.find(
    (item): item is DisplayErrorText => item.type === "error"
  );
  if (error) {
    return <Error content={error} />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <Theme
        contents={displayInfo}
        translations={translations}
        interactions={interactions}
        onInteraction={gameStateManager.setInteraction}
        settings={activeTheme.settings}
        gameModelManager={content}
        skipToStep={getClientSettings().skipMode ? Infinity : 0}
      />
    </Suspense>
  );
};
