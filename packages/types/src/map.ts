import { GameWorld } from "./world";

export type MapDirection =
  | Exclude<`${"north" | "south" | ""}${"east" | "west" | ""}`, "">
  | "teleport"
  | "contains"
  | "parent"
  | "floor-up"
  | "floor-down";

export type WorldMap<G extends GameWorld> = {
  start: keyof G["locations"] | undefined;
  locations: {
    [key in keyof G["locations"]]?: {
      characters?: {
        [key in keyof G["characters"]]?: {
          availability?: string;
        };
      };
      connections: {
        [key in keyof G["locations"]]?: {
          direction: MapDirection;
          availability?: string;
        };
      };
    };
  };
};
