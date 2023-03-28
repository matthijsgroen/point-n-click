import { useAtomValue } from "jotai";
import React from "react";
import { gameContentAtom } from "../content/gameContent";
import { DiagramView } from "./DiagramView";

export const WireDiagram = () => {
  const gameContent = useAtomValue(gameContentAtom);
  if (!gameContent) {
    return null;
  }

  return <DiagramView diagram={gameContent.diagram} />;
};
