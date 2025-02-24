import { produce } from "immer";
import type { ContentPlugin, SystemPluginInterface } from "../types/plugins";
import { GameWorld } from "../types/world";

export type DisplayEffect = "fade" | "blur";

export type DisplayObject<
  Game extends GameWorld,
  TDisplayObject extends keyof Game["displayObjects"]
> = {
  readonly show: (effect?: DisplayEffect, duration?: number) => void;
  readonly hide: (effect?: DisplayEffect, duration?: number) => void;
  readonly move: (x: number, y: number, duration?: number) => void;
};

type SceneHelper<Game extends GameWorld> = {
  readonly getDisplayObject: <
    TDisplayObject extends keyof Game["displayObjects"]
  >(
    displayObject: TDisplayObject,
    zIndex: number
  ) => DisplayObject<Game, TDisplayObject>;
};

const actions = {
  setupScene:
    <TGame extends GameWorld>(helper: SystemPluginInterface<TGame>) =>
    <TResult>(sceneDefinition: (s: SceneHelper<TGame>) => TResult): TResult => {
      // helper.addAction({
      //   type: "descriptionText",
      //   text,
      // });
      const sceneHelper = {
        getDisplayObject: (displayObject, zIndex) => {
          return {
            show: (effect?: DisplayEffect, duration?: number) => {
              helper.addAction({
                type: "showObject",
                displayObject,
                zIndex,
                effect,
                duration,
              });
            },
            hide: (effect?: DisplayEffect, duration?: number) => {
              helper.addAction({
                type: "hideObject",
                displayObject,
                zIndex,
                effect,
                duration,
              });
            },
            move: (x, y, duration) => {
              // move display object
            },
          };
        },
      };

      return sceneDefinition(sceneHelper);
    },
} as const;

export type RenderElement = {
  assetPath: string;
  offsetX: number;
  offsetY: number;
};

export type RenderObject = {
  size: [number, number];
  elements: RenderElement[];
};

export type RenderState<
  Game extends GameWorld,
  TDisplayObject extends keyof Game["displayObjects"]
> = {
  state: Game["displayObjects"][TDisplayObject]["states"];
} & (Game["displayObjects"][TDisplayObject]["flags"] extends string
  ? {
      flags?: Partial<
        Record<Game["displayObjects"][TDisplayObject]["flags"], boolean>
      >;
    }
  : {});
