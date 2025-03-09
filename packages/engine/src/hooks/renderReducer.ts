import { produce } from "immer";
import {
  DisplayEffect,
  FlattenObjectRenderState,
  PositionedRenderObject,
} from "../dsl/displayObjects";
import { DisplayObjectAction } from "../dsl/execution/actions";
import { GameData } from "../dsl/syntax/dsl";
import { GameWorld, StateObject } from "../dsl/types/world";

export type ObjectInfo<TGame extends GameWorld> = {
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

export const renderStateToRenderLayout = <
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

export const reducer = (
  state: RenderState<GameWorld>,
  action: DisplayObjectAction<GameWorld>
) => {
  const key = `${action.itemType}_${String(action.itemName)}_${String(
    action.object
  )}`;
  console.log("reducing", key, state, action.operation);
  const operation = action.operation;
  switch (operation.type) {
    case "define":
      return produce(state, (draft) => {
        const currentState = draft[action.object]?.state;
        draft[key] = {
          position: operation.position,
          zIndex: operation.zIndex,
          itemType: action.itemType,
          itemName: action.itemName,
          name: action.object,
          scale: operation.scale ?? 1,
          state: Object.assign({}, currentState, operation.displayState),
          visible: false,
          effects: [],
        };
      });
    case "show":
      return produce(state, (draft) => {
        draft[key].visible = true;
        draft[key].effects.push({
          type: "show",
          effect: operation.effect ?? "fade",
          duration: operation.duration ?? 500,
        });
      });
    case "hide":
      return produce(state, (draft) => {
        draft[key].visible = false;
        draft[key].effects.push({
          type: "hide",
          effect: operation.effect ?? "fade",
          duration: operation.duration ?? 500,
        });
      });
    case "move":
      return produce(state, (draft) => {
        draft[key].position = [operation.x, operation.y];
      });
    case "pose":
      return produce(state, (draft) => {
        const currentState = draft[key]?.state;
        draft[key].state = Object.assign(
          {},
          currentState,
          operation.displayState
        );
        if (operation.position) {
          draft[key].position = operation.position;
        }
      });
    case "cleanup":
      return produce(state, (draft) => {
        Object.entries(draft).forEach(([key, value]) => {
          if (
            value.itemType === action.itemType &&
            value.itemName === action.itemName
          ) {
            delete draft[key];
          }
        });
      });
    default:
      return state;
  }
};
