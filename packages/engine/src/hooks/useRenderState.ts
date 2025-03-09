import type { PositionedRenderObject } from "../dsl/displayObjects";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameData } from "../dsl/syntax/dsl";
import { GameWorld } from "../dsl/types/world";
import { useMemo, useReducer } from "react";
import { reducer, renderStateToRenderLayout } from "./renderReducer";

export const useRenderState = (
  data: GameData<GameWorld>
): [
  PositionedRenderObject[],
  (action: DisplayObjectAction<GameWorld>) => void
] => {
  const [renderState, dispatch] = useReducer(reducer, {});

  const result = useMemo(
    () => renderStateToRenderLayout(data, renderState ?? {}),
    [data, renderState]
  );
  return [result, dispatch];
};
