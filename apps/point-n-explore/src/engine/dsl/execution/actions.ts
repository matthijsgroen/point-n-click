import { GameWorld } from "../types/world";

export type Action<Game extends GameWorld> = TextAction | SayAction<Game>;

export type TextAction = {
  type: "text";
  text: string[];
};

export type SayAction<Game extends GameWorld> = {
  type: "say";
  character: keyof Game["characters"];
  text: string[];
};