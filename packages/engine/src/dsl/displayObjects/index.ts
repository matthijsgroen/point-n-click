import { GameWorld } from "../types/world";

export type DisplayEffect = "fade" | "blur";

export type DisplayObject<
  TGame extends GameWorld,
  TDisplayObject extends keyof TGame["displayObjects"]
> = {
  readonly show: (effect?: DisplayEffect, duration?: number) => void;
  readonly hide: (effect?: DisplayEffect, duration?: number) => void;
  readonly move: (x: number, y: number, duration?: number) => void;
  readonly pose: (
    pose: Exclude<TGame["displayObjects"][TDisplayObject]["poses"], undefined>
  ) => void;
} & (TGame["displayObjects"][TDisplayObject]["flags"] extends string
  ? {
      readonly flags: (
        flags: Partial<
          Record<TGame["displayObjects"][TDisplayObject]["flags"], boolean>
        >
      ) => void;
    }
  : {});

export type SceneHelper<TGame extends GameWorld> = {
  readonly get: <TDisplayObject extends keyof TGame["displayObjects"]>(
    displayObject: TDisplayObject,
    zIndex: number,
    position: [number, number],
    state?: RenderState<TGame, TDisplayObject>
  ) => DisplayObject<TGame, TDisplayObject>;
};

export type RenderElement = {
  assetPath: string;
  offset: [number, number];
};

export type RenderObject = {
  size: [number, number];
  elements: RenderElement[];
};

export type RenderState<
  TGame extends GameWorld,
  TDisplayObject extends keyof TGame["displayObjects"]
> = {
  state: TGame["displayObjects"][TDisplayObject]["states"];
} & (TGame["displayObjects"][TDisplayObject]["flags"] extends string
  ? {
      flags?: Partial<
        Record<TGame["displayObjects"][TDisplayObject]["flags"], boolean>
      >;
    }
  : {});
