import { GameState } from "../syntax/state";
import { GameWorld } from "../types/world";

export type Action<Game extends GameWorld> =
  | TextAction
  | ErrorAction
  | SayAction<Game>
  | StateAction<Game>
  | SceneAction<Game>
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

export type PluginAction<
  PluginName extends string = string,
  Format extends Record<string, unknown> = Record<string, unknown>
> = {
  type: "plugin";
  plugin: PluginName;
  action: Format;
};
