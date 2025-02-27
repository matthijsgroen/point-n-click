import { useEffect } from "react";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameWorld } from "../main";

type Props<TGame extends GameWorld> = {
  action: DisplayObjectAction<TGame>;
  onComplete: VoidFunction;
  updateRenderState: (action: DisplayObjectAction<TGame>) => void;
};

export const RenderDisplayAction = <TGame extends GameWorld>({
  action,
  onComplete,
  updateRenderState,
}: Props<TGame>) => {
  useEffect(() => {
    updateRenderState(action);
    // Some actions require a delay before the next action is executed
    console.log("calling onComplete");
    const clear = setTimeout(() => {
      onComplete();
    }, 400);
    return () => clearTimeout(clear);
  }, [action, onComplete, updateRenderState]);

  return null;
};
