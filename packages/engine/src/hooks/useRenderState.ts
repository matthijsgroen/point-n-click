import { produce } from "immer";
import type {
  DisplayEffect,
  FlattenObjectRenderState,
  PositionedRenderObject,
} from "../dsl/displayObjects";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameData } from "../dsl/syntax/dsl";
import { GameWorld, StateObject } from "../dsl/types/world";
import { useCallback, useState } from "react";

type ObjectInfo<TGame extends GameWorld> = {
  position: [number, number];
  zIndex: number;
  scale: number;
  itemType: StateObject | "scene";
  itemName: string;
  name: string;
  state: FlattenObjectRenderState<TGame, keyof TGame["displayObjects"]>;
  visible: boolean;
  effects: {
    type: "show" | "hide";
    effect: DisplayEffect;
    duration: number;
  }[];
};

const renderStateToRenderLayout = <
  TGame extends GameWorld,
  TGameData extends GameData<TGame>
>(
  data: TGameData,
  renderState: RenderState<TGame>
): PositionedRenderObject[] =>
  // Start with object with lowest zIndex
  Object.entries(renderState)
    .sort(([, a], [, b]) => a.zIndex - b.zIndex)
    .filter(([, info]) => info.visible)
    .map<PositionedRenderObject>(([object, info]) => {
      const objectDefinition = data.displayObjects[info.name];
      if (!objectDefinition) {
        throw new Error(`DisplayObject definition ${object} not found`);
      }
      const renderObject = objectDefinition.compose(info.state);

      return {
        ...renderObject,
        position: info.position,
        scale: info.scale,
        name: info.name,
        itemType: info.itemType,
        itemName: info.itemName,
      };
    });

export type RenderState<TGame extends GameWorld> = Record<
  string,
  ObjectInfo<TGame>
>;

export const useRenderState = <
  TGame extends GameWorld,
  TGameData extends GameData<TGame>
>(
  data: TGameData
): [PositionedRenderObject[], (action: DisplayObjectAction<TGame>) => void] => {
  const [renderState, setRenderState] = useState<RenderState<TGame>>({});

  const updateRenderState = useCallback(
    (action: DisplayObjectAction<TGame>) => {
      const operation = action.operation;
      const key = `${action.itemType}_${String(action.itemName)}_${String(
        action.object
      )}`;

      if (operation.type === "define") {
        setRenderState(
          produce((draft) => {
            const currentState = draft[key]?.state;
            draft[key] = {
              position: operation.position,
              zIndex: operation.zIndex,
              itemType: action.itemType,
              itemName: String(action.itemName),
              name: String(action.object),
              scale: operation.scale ?? 1,
              state: Object.assign({}, currentState, operation.displayState),
              visible: false,
              effects: [],
            };
          })
        );
      }

      if (operation.type === "show") {
        setRenderState(
          produce((draft) => {
            draft[key].visible = true;
            draft[key].effects.push({
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
            draft[key].visible = false;
            draft[key].effects.push({
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
            draft[key].position = [operation.x, operation.y];
          })
        );
      }

      if (operation.type === "pose") {
        setRenderState(
          produce((draft) => {
            const currentState = draft[key]?.state;
            draft[key].state = Object.assign(
              {},
              currentState,
              operation.displayState
            );
            if (operation.position) {
              draft[key].position = operation.position;
            }
          })
        );
      }
      if (operation.type === "cleanup") {
        setRenderState(
          produce((draft) => {
            Object.entries(draft).forEach(([key, value]) => {
              if (
                value.itemType === action.itemType &&
                value.itemName === action.itemName
              ) {
                delete draft[key];
              }
            });
          })
        );
      }
    },
    []
  );

  const result = renderStateToRenderLayout(data, renderState ?? {});
  return [result, updateRenderState];
};
