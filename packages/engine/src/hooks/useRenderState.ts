import { produce, type Draft } from "immer";
import type {
  DisplayEffect,
  ObjectRenderState,
  RenderObject,
} from "../dsl/displayObjects";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameData } from "../dsl/syntax/dsl";
import { BaseContentPlugin } from "../dsl/types/plugins";
import { GameWorld } from "../dsl/types/world";
import { useCallback, useState } from "react";

type ObjectInfo<TGame extends GameWorld> = {
  position: [number, number];
  zIndex: number;
  state: ObjectRenderState<TGame, keyof TGame["displayObjects"]>;
  visible: boolean;
  effects: {
    type: "show" | "hide";
    effect: DisplayEffect;
    duration: number;
  }[];
};

const renderStateToRenderLayout = <
  TGame extends GameWorld,
  TPlugins extends readonly BaseContentPlugin[],
  TGameData extends GameData<TGame>
>(
  data: TGameData,
  renderState: RenderState<TGame>
): Record<string, RenderObject> => {
  // Start with object with lowest zIndex
  const sortedObjects = Object.fromEntries(
    Object.entries(renderState)
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
      .filter(([, info]) => info.visible)
      .map(([object, info]) => {
        const objectDefinition = data.displayObjects[object];
        const renderObject = objectDefinition?.compose(info.state);

        return [object, renderObject];
      })
  ) as Record<string, RenderObject>;

  return sortedObjects;
};

export type RenderState<TGame extends GameWorld> = Record<
  string,
  ObjectInfo<TGame>
>;

export const useRenderState = <
  TGame extends GameWorld,
  TGameData extends GameData<TGame>
>(
  data: TGameData
): [
  Record<string, RenderObject>,
  (action: DisplayObjectAction<TGame>) => void
] => {
  const [renderState, setRenderState] = useState<RenderState<TGame>>({});
  console.log(renderState);

  const updateRenderState = useCallback(
    (action: DisplayObjectAction<TGame>) => {
      const operation = action.operation;

      if (operation.type === "define") {
        setRenderState(
          produce((draft) => {
            const currentState = draft[String(action.object)]?.state;
            console.log("define", action.object);
            draft[String(action.object)] = {
              position: operation.position,
              zIndex: operation.zIndex,
              state: {
                state: {
                  ...currentState?.state,
                  ...operation.displayState.state,
                },
                flags: {
                  ...(currentState?.flags ?? {}),
                  ...operation.displayState.flags,
                },
              } as Draft<
                ObjectRenderState<TGame, keyof TGame["displayObjects"]>
              >,
              visible: false,
              effects: [],
            };
          })
        );
      }

      if (operation.type === "show") {
        setRenderState(
          produce((draft) => {
            draft[String(action.object)].visible = true;
            draft[String(action.object)].effects.push({
              type: "show",
              effect: operation.effect ?? "fade",
              duration: operation.duration ?? 500,
            });
          })
        );
      }

      if (operation.type === "hide") {
        setRenderState(
          produce((draft) => {
            draft[String(action.object)].visible = false;
            draft[String(action.object)].effects.push({
              type: "hide",
              effect: operation.effect ?? "fade",
              duration: operation.duration ?? 500,
            });
          })
        );
      }

      if (operation.type === "move") {
        setRenderState(
          produce((draft) => {
            draft[String(action.object)].position = [operation.x, operation.y];
          })
        );
      }

      if (operation.type === "pose") {
        setRenderState(
          produce((draft) => {
            const currentState = draft[String(action.object)]?.state;
            draft[String(action.object)].state = {
              state: {
                ...currentState?.state,
                ...operation.displayState.state,
              },
              flags: {
                ...(currentState?.flags ?? {}),
                ...operation.displayState.flags,
              },
            } as Draft<ObjectRenderState<TGame, keyof TGame["displayObjects"]>>;
            if (operation.position) {
              draft[String(action.object)].position = operation.position;
            }
          })
        );
      }
    },
    []
  );

  const result = renderStateToRenderLayout(data, renderState);
  return [result, updateRenderState];
};
