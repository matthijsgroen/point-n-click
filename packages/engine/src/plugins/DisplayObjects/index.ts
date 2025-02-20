import type {
  ContentPlugin,
  SystemPluginContentInterface,
  SystemPluginInterface,
} from "../../dsl/types/plugins";
import { GameWorld } from "../../dsl/types/world";

type DisplayEffect = "fade" | "blur";

type ImageAsset = {
  readonly show: (effect?: DisplayEffect, duration?: number) => void;
  readonly hide: (effect?: DisplayEffect, duration?: number) => void;
};

type DisplayObject<
  Game extends GameWorld,
  TDisplayObject extends keyof Game["characters"]
> = {
  readonly show: (effect?: DisplayEffect, duration?: number) => void;
  readonly hide: (effect?: DisplayEffect, duration?: number) => void;
  readonly move: (x: number, y: number, duration?: number) => void;
};

type SceneHelper<Game extends GameWorld> = {
  readonly defineImage: (assetPath: string, zIndex: number) => ImageAsset;
  readonly getDisplayObject: <TDisplayObject extends keyof Game["characters"]>(
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
        defineImage: (assetPath: string, zIndex: number) => {
          return {
            show: (effect?: DisplayEffect, duration?: number) => {
              helper.addAction({
                type: "showImage",
                assetPath,
                zIndex,
                effect,
                duration,
              });
            },
            hide: (effect?: DisplayEffect, duration?: number) => {
              helper.addAction({
                type: "hideImage",
                assetPath,
                zIndex,
                effect,
                duration,
              });
            },
          };
        },
        getDisplayObject: (displayObject, zIndex) => {
          return {
            show: (effect?: DisplayEffect, duration?: number) => {
              // show display object
            },
            hide: (effect?: DisplayEffect, duration?: number) => {
              // hide display object
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

const content = {
  defineDisplayObject:
    <TGame extends GameWorld>(helper: SystemPluginContentInterface<TGame>) =>
    (name: string) => {},
};

export const plugin: ContentPlugin<
  "DisplayObjects",
  typeof actions,
  typeof content
> = {
  name: "DisplayObjects",
  actions,
  content,
};
