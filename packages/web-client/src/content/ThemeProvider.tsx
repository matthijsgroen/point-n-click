import { getDisplayInfo, getInteractions } from "@point-n-click/engine";
import React from "react";
import { useGameContent, useGameState } from "./ContentProvider";
import { Theme } from "@point-n-click/themes";
import { getClientSettings } from "../settings";

type RegisteredTheme<Settings extends Record<string, unknown>> = {
  theme: Theme<Settings>;
  settings: Settings;
  id: string;
};

const themeList: RegisteredTheme<Record<string, unknown>>[] = [];

export const registerTheme = <Settings extends Record<string, unknown>>(
  id: string,
  theme: Theme<Settings>,
  settings: Partial<Settings>
) => {
  themeList.push({
    id,
    theme: theme as Theme<Record<string, unknown>>,
    settings,
  });
};

export const ThemeProvider: React.FC = () => {
  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  const activeTheme = themeList[0];
  const Theme = activeTheme.theme.render;
  const renderSettings: typeof activeTheme.theme.defaultSettings = {
    ...activeTheme.theme.defaultSettings,
    ...activeTheme.settings,
  };

  return (
    <Theme
      contents={displayInfo}
      interactions={interactions}
      onInteraction={gameStateManager.setInteraction}
      settings={renderSettings}
      gameModelManager={content}
      skipToStep={getClientSettings().skipMode ? Infinity : 0}
    />
  );
};
