import { Action } from "../dsl/execution/actions";
import { GameWorld } from "../dsl/types/world";
import { useState, useEffect, useCallback } from "react";

export const useAction = <TGame extends GameWorld>(
  actions: Action<TGame>[]
) => {
  const [playActions, setActions] = useState<Action<TGame>[]>(actions);
  const [actionIndex, setActionIndex] = useState(0);

  useEffect(() => {
    setActions(actions);
    setActionIndex(0);
  }, [actions]);

  return {
    action: playActions[actionIndex],
    completeAction: useCallback(() => setActionIndex((index) => index + 1), []),
    allCompleted: actionIndex >= playActions.length,
  };
};
