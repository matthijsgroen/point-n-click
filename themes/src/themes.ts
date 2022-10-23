import { GameWorld } from "@point-n-click/types";
import type { FC } from "react";
import {
  DisplayInfo,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";

export type ThemeRenderer<Settings extends Record<string, unknown>> = FC<{
  settings: Settings;
  contents: DisplayInfo<GameWorld>[];
  interactions: Interactions;
  gameModelManager: GameModelManager<GameWorld>;
  onInteraction: (interactionId: string) => void;
}>;

export type Theme<Settings extends Record<string, unknown>> = {
  name: string;
  version: string;
  author: string;
  render: ThemeRenderer<Settings>;
  defaultSettings: Settings;
  // Will be extended with other render functions, like menu's
};
