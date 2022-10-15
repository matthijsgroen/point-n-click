import { useQuery } from "@tanstack/react-query";
import React, { createContext, PropsWithChildren } from "react";
import { GameModel } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";

const GameContentContext = createContext<GameModel<GameWorld>>({
  settings: {
    defaultLocale: "en-US",
    initialState: {},

    characterConfigs: {},
  },
  locations: [],
  overlays: [],
});

export const ContentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isLoading, data } = useQuery(
    ["gameContent"],
    async (): Promise<GameModel<GameWorld>> => {
      const data = await fetch("/assets/contents.json");
      return data.json();
    }
  );

  // Add state management here as well.

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }
  return (
    <GameContentContext.Provider value={data}>
      {children}
    </GameContentContext.Provider>
  );
};
