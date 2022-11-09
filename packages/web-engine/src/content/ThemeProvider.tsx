import {
  DisplayErrorText,
  getDisplayInfo,
  getInteractions,
} from "@point-n-click/engine";
import React, { Suspense } from "react";
import { useGameContent, useGameState } from "./ContentProvider";
import { ThemeDefinition, ThemeSettings } from "@point-n-click/themes";
import { getClientSettings } from "../settings";
import { Error } from "./Error";
import { Loading } from "./Loading";

type RegisteredTheme<Settings extends ThemeSettings> = {
  theme: ThemeDefinition<Settings>;
  id: string;
};

const themeList: RegisteredTheme<ThemeSettings>[] = [];

export const registerTheme = <Settings extends ThemeSettings>(
  id: string,
  theme: ThemeDefinition<Settings>
) => {
  themeList.push({
    id,
    theme: theme as unknown as ThemeDefinition<ThemeSettings>,
  });
};

export const ThemeProvider: React.FC = () => {
  const content = useGameContent();
  const gameStateManager = useGameState();
  gameStateManager.restoreSaveState();

  const displayInfo = getDisplayInfo(content, gameStateManager);
  const interactions = getInteractions(content, gameStateManager);

  const activeTheme = themeList[0];
  const Theme = React.lazy(activeTheme.theme.renderer);

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
        interactions={interactions}
        onInteraction={gameStateManager.setInteraction}
        settings={activeTheme.theme.settings}
        gameModelManager={content}
        skipToStep={getClientSettings().skipMode ? Infinity : 0}
      />
    </Suspense>
  );
};
