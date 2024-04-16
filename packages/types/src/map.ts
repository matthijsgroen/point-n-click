import { GameWorld } from "./world";

export type MapDirection =
  | Exclude<`${"north" | "south" | ""}${"east" | "west" | ""}`, "">
  | "teleport"
  | "contains"
  | "parent";

export type WorldMap<G extends GameWorld> = {
  start: string;
  locations: {
    [key in keyof G["locations"]]?: {
      characters?: {
        [key in keyof G["characters"]]?: {
          availability: string;
        };
      };
      connections: {
        [key in keyof G["locations"]]?: {
          direction: MapDirection;
          lockedTill?: string;
        };
      };
    };
  };
};
