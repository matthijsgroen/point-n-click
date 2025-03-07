import { use } from "react";
import { GameContext } from "./context";
import { createReadOnlyProxy } from "../dsl/execution/proxy/readOnlyProxy";

export const useGameData = () => {
  return use(GameContext).gameData;
};

export const useGameState = () => {
  return createReadOnlyProxy(use(GameContext).state);
};

export const useGameAction = () => {
  const { action, completeAction } = use(GameContext);
  return { action, completeAction };
};
