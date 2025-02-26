import { produce, type Draft } from "immer";
import { DisplayEffect, RenderState } from "../dsl/displayObjects";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameData } from "../dsl/syntax/dsl";
import { BaseContentPlugin } from "../dsl/types/plugins";
import { GameWorld } from "../dsl/types/world";

type ObjectInfo = {
  position: [number, number];
  zIndex: number;
  state: RenderState<TGame, keyof TGame["displayObjects"]>;
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
  TGameData extends GameData<TGame, TPlugins>
>(
  data: TGameData,
  renderState: Record<string, ObjectInfo>
) => {
  // Start with object with lowest zIndex
  const sortedObjects = Object.fromEntries(
    Object.entries(renderState)
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
      .map(([object, info]) => {
        const objectDefinition = data.displayObjects[object];
        const renderObject = objectDefinition?.compose(info.state);
        if (!info.visible) {
          return [];
        }

        return [object, renderObject];
      })
  );

  return sortedObjects;
};

export const useRenderState = <
  TGame extends GameWorld,
  TPlugins extends readonly BaseContentPlugin[],
  TGameData extends GameData<TGame, TPlugins>
>(
  data: TGameData
) => {
  let renderState: Record<string, ObjectInfo> = {};

  const updateRenderState = (action: DisplayObjectAction<TGame>) => {
    const operation = action.operation;

    if (operation.type === "define") {
      renderState = produce(renderState, (draft) => {
        const currentState = draft[String(action.object)]?.state;
        draft[String(action.object)] = {
          position: operation.position,
          zIndex: operation.zIndex,
          state: {
            state: { ...currentState?.state, ...operation.displayState.state },
            flags: {
              ...currentState?.flags,
              ...operation.displayState.flags,
            },
          } as Draft<RenderState<TGame, keyof TGame["displayObjects"]>>,
          visible: false,
          effects: [],
        };
      });
    }

    if (operation.type === "show") {
      renderState = produce(renderState, (draft) => {
        draft[String(action.object)].visible = true;
        draft[String(action.object)].effects.push({
          type: "show",
          effect: operation.effect ?? "fade",
          duration: operation.duration ?? 500,
        });
      });
    }

    if (operation.type === "hide") {
      renderState = produce(renderState, (draft) => {
        draft[String(action.object)].visible = false;
        draft[String(action.object)].effects.push({
          type: "hide",
          effect: operation.effect ?? "fade",
          duration: operation.duration ?? 500,
        });
      });
    }

    if (operation.type === "move") {
      renderState = produce(renderState, (draft) => {
        draft[String(action.object)].position = [operation.x, operation.y];
      });
    }

    if (operation.type === "pose") {
      renderState = produce(renderState, (draft) => {
        const currentState = draft[String(action.object)]?.state;
        draft[String(action.object)].state = {
          state: { ...currentState?.state, ...operation.displayState.state },
          flags: {
            ...currentState?.flags,
            ...operation.displayState.flags,
          },
        } as Draft<RenderState<TGame, keyof TGame["displayObjects"]>>;
        if (operation.position) {
          draft[String(action.object)].position = operation.position;
        }
      });
    }

    return renderStateToRenderLayout(data, renderState);
  };

  return updateRenderState;
};
