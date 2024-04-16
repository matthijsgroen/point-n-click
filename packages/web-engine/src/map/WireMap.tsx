import { useAtomValue } from "jotai";
import React from "react";
import { gameContentAtom } from "../content/gameContent";
import { MapView } from "./MapView";

export const WireMap = () => {
  const gameContent = useAtomValue(gameContentAtom);
  if (!gameContent) {
    return null;
  }

  return <MapView map={gameContent.worldMap} />;
};
