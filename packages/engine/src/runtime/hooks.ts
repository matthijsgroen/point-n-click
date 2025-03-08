import { use } from "react";
import { createReadOnlyProxy } from "../dsl/execution/proxy/readOnlyProxy";
import { GameStateContext } from "./GameStateProvider";

export const useGameState = () => {
  return createReadOnlyProxy(use(GameStateContext).state);
};

export const useGameAction = () => {
  const { action, completeAction } = use(GameStateContext);
  return { action, completeAction };
};
