import { GameWorld } from "@point-n-click/types";
import React from "react";
import {
  DisplayInfo,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";
import { JSONValue } from "@point-n-click/state";

export type ThemeSettings = { [x: string]: JSONValue };

export type ThemeRenderer<Settings extends ThemeSettings> = React.FC<{
  settings: Settings;
  contents: DisplayInfo<GameWorld>[];
  interactions: Interactions;
  skipToStep: number;
  gameModelManager: GameModelManager<GameWorld>;
  onInteraction: (interactionId: string) => void;
}>;

export type ThemeDefinition<Settings extends ThemeSettings> = {
  name: string;
  version: string;
  author: string;
  packageName: string;
  renderer: () => Promise<{ default: ThemeRenderer<Settings> }>;
  settings: Settings;
};

export type Theme<Settings extends ThemeSettings> = (
  settings: Partial<Settings>
) => ThemeDefinition<ThemeSettings>;
