import {
  DisplayErrorText,
  getDisplayInfo,
  getInteractions,
  getRegisteredThemes,
  getTranslation,
  getTranslationScope,
  getTranslationText,
} from "@point-n-click/engine";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useGameContent, useGameState } from "./ContentProvider";
import {
  getClientSettings,
  setClientSettings,
  subscribeClientSettings,
} from "../settings";
import { Error } from "./Error";
import { Loading } from "./Loading";
import { TranslationFile } from "@point-n-click/types";

export type GameTheme = {
  index: number;
  name: string;
};

export const useGameTheme = (): {
  theme: GameTheme;
  availableThemes: GameTheme[];
  setTheme: (newTheme: GameTheme) => void;
} => {
  const activeThemeIndex = getClientSettings().currentTheme;
  const modelManager = useGameContent();
  const availableThemes = modelManager.getModel().themes.map((theme, index) => {
    const originalName = theme.name;
    const name =
      getTranslationText(["meta", "themes"], originalName) || originalName;

    return {
      name,
      index,
    };
  });

  return {
    theme: availableThemes[activeThemeIndex],
    availableThemes,
    setTheme: (theme) => {
      setClientSettings({ currentTheme: theme.index });
    },
  };
};

export const ThemeProvider: React.FC = () => {
  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  const [, rerender] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeClientSettings((newSettings, oldSettings) => {
      if (newSettings.currentTheme !== oldSettings.currentTheme) {
        rerender((s) => (s + 1) % 100);
      }
    });
    return unsubscribe;
  }, []);

  const currentTheme = getClientSettings().currentTheme;
  const activeTheme = getRegisteredThemes()[currentTheme];
  const Theme = useMemo(() => React.lazy(activeTheme.renderer), [activeTheme]);

  const themeTranslations = useMemo((): TranslationFile => {
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
        translations={themeTranslations}
        interactions={interactions}
        onInteraction={gameStateManager.setInteraction}
        themeSettings={activeTheme.settings}
        gameModelManager={content}
        skipToStep={getClientSettings().skipMode ? Infinity : 0}
      />
    </Suspense>
  );
};
