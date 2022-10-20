import { getDisplayInfo, getInteractions } from "@point-n-click/engine";
import React from "react";
import { useGameContent, useGameState } from "../../content/ContentProvider";
import { Theme } from "./types";

const themeList: Theme[] = [];

export const registerTheme = (theme: Theme) => {
  themeList.push(theme);
};

export const ThemeProvider: React.FC = () => {
  const activeTheme = themeList[0];
  const Theme = activeTheme.render;

  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  return <Theme contents={displayInfo} interactions={interactions} />;
};
