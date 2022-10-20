import { getDisplayInfo, getInteractions } from "@point-n-click/engine";
import React, { useCallback } from "react";
import { useGameContent, useGameState } from "../../content/ContentProvider";
import { Theme } from "./types";

const themeList: Theme[] = [];

export const registerTheme = (theme: Theme) => {
  themeList.push(theme);
};

export const ThemeProvider: React.FC = () => {
  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  const activeTheme = themeList[0];
  const Theme = activeTheme.render;

  const handleInteraction = useCallback(
    (id: string) => {
      gameStateManager.updateState((state) => ({
        ...state,
        currentInteraction: id,
      }));
      gameStateManager.updateSaveState();
    },
    [gameStateManager]
  );

  return (
    <Theme
      contents={displayInfo}
      interactions={interactions}
      onInteraction={handleInteraction}
    />
  );
};
