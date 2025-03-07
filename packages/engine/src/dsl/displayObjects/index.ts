import { GameWorld, StateObject } from "../types/world";

export type DisplayEffect = "fade" | "blur" | "instant";

export type DisplayObject<
  TGame extends GameWorld,
  TDisplayObject extends keyof TGame["displayObjects"]
> = {
  readonly show: (effect?: DisplayEffect, duration?: number) => void;
  readonly hide: (effect?: DisplayEffect, duration?: number) => void;
  readonly move: (x: number, y: number, duration?: number) => void;
  readonly pose: (
    pose: Partial<FlattenObjectRenderState<TGame, TDisplayObject>>
  ) => void;
};

export type SceneHelper<TGame extends GameWorld> = {
  readonly get: <TDisplayObject extends keyof TGame["displayObjects"]>(
    displayObject: TDisplayObject,
    zIndex: number,
    position: [number, number],
    state?: Partial<FlattenObjectRenderState<TGame, TDisplayObject>>,
    scale?: number
  ) => DisplayObject<TGame, TDisplayObject>;
};

export type RenderElement = {
  assetPath: string;
  offset: [x: number, y: number];
};

export type RenderObject = {
  size: [width: number, height: number];
  elements: RenderElement[];
};

export type PositionedRenderObject = RenderObject & {
  itemType: StateObject | "scene";
  itemName: string;
  name: string;
  position: [x: number, y: number];
  scale: number;
};

export type FlattenObjectRenderState<
  TGame extends GameWorld,
  TDisplayObject extends keyof TGame["displayObjects"]
> = TGame["displayObjects"][TDisplayObject]["states"] &
  (TGame["displayObjects"][TDisplayObject]["flags"] extends string
    ? Record<TGame["displayObjects"][TDisplayObject]["flags"], boolean>
    : {});

export type ObjectRenderState<
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
  : { flags?: {} });

export type PartialObjectRenderState<
  TGame extends GameWorld,
  TDisplayObject extends keyof TGame["displayObjects"]
> = {
  state?: Partial<TGame["displayObjects"][TDisplayObject]["states"]>;
} & (TGame["displayObjects"][TDisplayObject]["flags"] extends string
  ? {
      flags?: Partial<
        Record<TGame["displayObjects"][TDisplayObject]["flags"], boolean>
      >;
    }
  : { flags?: {} });
