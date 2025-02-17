/* eslint-disable @typescript-eslint/no-explicit-any */
import { PluginAction } from "../execution/actions";
import { GameWorld } from "./world";

export type SystemInterface = {
  addAction: <T extends PluginAction["action"]>(action: T) => void;
};

export type DSLExtension<T extends string = string> = Record<
  T extends "character" ? never : string,
  (system: SystemInterface, ...args: any[]) => void
> & {
  character?: (
    system: SystemInterface
  ) => <Game extends GameWorld>(
    character: keyof Game["characters"]
  ) => Record<string, (...args: any[]) => void>;
};

export type ContentPlugin<Name extends string, Actions extends DSLExtension> = {
  name: Name;
  actions: Actions;
};
