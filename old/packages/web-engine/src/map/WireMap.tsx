import { useAtomValue } from "jotai";
import React from "react";
import { gameContentAtom } from "../content/gameContent";
import { MapLayoutView } from "./MapLayoutView";

export const WireMap = () => {
  const gameContent = useAtomValue(gameContentAtom);
  if (!gameContent) {
    return null;
  }

  return <MapLayoutView map={gameContent.worldMap} />;
};
