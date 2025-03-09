import { useEffect } from "react";
import { Action, DisplayObjectAction } from "../dsl/execution/actions";
import { GameWorld } from "../main";

export const useDisplayAction = <TGame extends GameWorld>(
  action: Action<TGame> | undefined,
  updateRenderState: (action: DisplayObjectAction<TGame>) => void,
  onComplete: VoidFunction
) => {
  useEffect(() => {
    if (!action || action.type !== "displayObject") {
      return;
    }
    updateRenderState(action);
    // Some actions require a delay before the next action is executed
    const clear = setTimeout(() => {
      onComplete();
    }, 10);
    return () => clearTimeout(clear);
  }, [action, onComplete, updateRenderState]);

  return null;
};
