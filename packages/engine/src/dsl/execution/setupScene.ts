import { DisplayEffect, SceneHelper } from "../displayObjects";
import { capitalize } from "../support/capitalize";
import { GameData } from "../syntax/dsl";
import { GameState } from "../syntax/state";
import { GameWorld } from "../types/world";
import { Action } from "./actions";
import { createReadOnlyProxy } from "./proxy/readOnlyProxy";

export const setupSceneHelper =
  <Game extends GameWorld>(
    getState: () => GameState<Game>,
    addAction: (action: Action<Game>) => void,
    _updateState: (
      patch: (currentState: GameState<Game>) => GameState<Game>
    ) => void,
    content: GameData<Game>
  ) =>
  <TResult>(sceneDefinition: (s: SceneHelper<Game>) => TResult): TResult => {
    const sceneHelper: SceneHelper<Game> = {
      get: (displayObject, zIndex, position, state, scale) => {
        const proxy = createReadOnlyProxy(getState());
        const objectDefinition = content.displayObjects[displayObject];
        const defaultState = objectDefinition?.defaultPose(proxy);

        if (!defaultState) {
          addAction({
            type: "error",
            message: `Display object "${String(displayObject)}" not found`,
          });
        } else {
          // get default state
          addAction({
            type: "displayObject",
            object: displayObject,
            operation: {
              type: "define",
              displayState: state ?? defaultState,
              zIndex,
              scale: scale ?? 1,
              position,
            },
          });
        }

        return {
          show: (effect?: DisplayEffect, duration?: number) => {
            addAction({
              type: "displayObject",
              object: displayObject,
              operation: {
                type: "show",
                effect,
                duration,
              },
            });
          },
          hide: (effect?: DisplayEffect, duration?: number) => {
            addAction({
              type: "displayObject",
              object: displayObject,
              operation: {
                type: "hide",
                effect,
                duration,
              },
            });
          },
          move: (x, y, duration) => {
            // move display object
          },
          pose: (pose) => {
            const proxy = createReadOnlyProxy(getState());
            const poseFunction =
              objectDefinition?.[`pose${capitalize(pose)}` as "defaultPose"];
            if (typeof poseFunction !== "function") {
              return;
            }
            const state = poseFunction(proxy);

            addAction({
              type: "displayObject",
              object: displayObject,
              operation: {
                type: "pose",
                displayState: state,
              },
            });
          },
          flags: (flags) => {
            addAction({
              type: "displayObject",
              object: displayObject,
              operation: {
                type: "pose",
                displayState: {
                  state: {},
                  flags,
                },
              },
            });
          },
        };
      },
    };

    return sceneDefinition(sceneHelper);
  };
