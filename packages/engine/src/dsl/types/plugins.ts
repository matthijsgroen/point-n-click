/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PluginAction } from "../execution/actions";
import type { GameWorld } from "./world";
import type { GameData } from "../syntax/dsl";

export type SystemPluginInterface<TGame extends GameWorld> = {
  addAction: <TAction extends PluginAction["action"]>(action: TAction) => void;
  getContent: <
    Plugins extends readonly BaseContentPlugin[],
    TContent extends GameData<TGame, Plugins>
  >() => TContent;
};

export type DSLExtension<T extends string = string> = Record<
  T extends "character" ? never : string,
  <TGame extends GameWorld>(
    system: SystemPluginInterface<TGame>
  ) => (...args: any[]) => void
> & {
  character?: <TGame extends GameWorld>(
    system: SystemPluginInterface<TGame>
  ) => <Game extends GameWorld>(
    character: keyof Game["characters"]
  ) => Record<string, (...args: any[]) => void>;
};

export type ContentPlugin<Name extends string, Actions extends DSLExtension> = {
  name: Name;
  actions: Actions;
};

export type BaseContentPlugin = ContentPlugin<string, DSLExtension>;
