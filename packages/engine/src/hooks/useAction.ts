import { Action } from "../dsl/execution/actions";
import { GameWorld } from "../dsl/types/world";
import { useEffect, useCallback, useState } from "react";
import { usePersistenceState } from "../runtime/GamePersistenceProvider";

export const useAction = (actions: Action<GameWorld>[]) => {
  const [playActions, setActions] = useState(actions);
  const [index, setActionIndex] = usePersistenceState("actionIndex");
  const actionIndex = index ?? 0;

  useEffect(() => {
    if (actions === playActions) {
      return;
    }
    setActions(() => actions);
    setActionIndex(() => 0);
  }, [actions]);

  return {
    action: playActions[actionIndex],
    completeAction: useCallback(() => setActionIndex((index) => index + 1), []),
    allCompleted: actionIndex >= playActions.length,
  };
};
