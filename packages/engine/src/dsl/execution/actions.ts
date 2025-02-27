import { DisplayEffect, ObjectRenderState } from "../displayObjects";
import { GameState } from "../syntax/state";
import { GameWorld } from "../types/world";

export type Action<Game extends GameWorld> =
  | TextAction
  | ErrorAction
  | SayAction<Game>
  | StateAction<Game>
  | SceneAction<Game>
  | DisplayObjectAction<Game>
  | PluginAction;

export type TextAction = {
  type: "text";
  text: string[];
};

export type SceneAction<Game extends GameWorld> = {
  type: "scene";
  scene: Game["scenes"];
};

export type ErrorAction = {
  type: "error";
  message: string;
};

export type SayAction<Game extends GameWorld> = {
  type: "say";
  character: keyof Game["characters"];
  text: string[];
};

export type StateAction<Game extends GameWorld> = {
  type: "state";
  patch: (state: GameState<Game>) => GameState<Game>;
};

export type DisplayObjectOperation<Game extends GameWorld> =
  | ShowOperation
  | HideOperation
  | MoveOperation
  | PoseOperation<Game>
  | DefineOperation<Game>;

export type DefineOperation<Game extends GameWorld> = {
  type: "define";
  displayState: ObjectRenderState<Game, keyof Game["displayObjects"]>;
  position: [number, number];
  zIndex: number;
};

export type ShowOperation = {
  type: "show";
  effect?: DisplayEffect;
  duration?: number;
};

export type HideOperation = {
  type: "hide";
  effect?: DisplayEffect;
  duration?: number;
};

export type MoveOperation = {
  type: "move";
  x: number;
  y: number;
  duration?: number;
};

export type PoseOperation<Game extends GameWorld> = {
  type: "pose";
  displayState: ObjectRenderState<Game, keyof Game["displayObjects"]>;
  position?: [number, number];
};

export type DisplayObjectAction<Game extends GameWorld> = {
  type: "displayObject";
  object: keyof Game["displayObjects"];
  operation: DisplayObjectOperation<Game>;
};

export type PluginAction<
  PluginName extends string = string,
  Format extends Record<string, unknown> = Record<string, unknown>
> = {
  type: "plugin";
  plugin: PluginName;
  action: Format;
};
