import {
  ContentPlugin,
  DSLExtension,
  GameWorld,
  TranslationFile,
} from "@point-n-click/types";
import React from "react";
import {
  DisplayInfo,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";
import { JSONValue, Locale } from "@point-n-click/state";

export type ThemeSettings = { [x: string]: JSONValue };

export type ThemeRenderer<Settings extends ThemeSettings> = React.FC<{
  themeSettings: Settings;
  contents: DisplayInfo<GameWorld>[];
  interactions: Interactions;
  skipToStep: number;
  gameModelManager: GameModelManager<GameWorld>;
  translations: TranslationFile;
  onInteraction: (interactionId: string) => void;
}>;

export type ThemeDefinition<
  Settings extends ThemeSettings,
  Extensions extends ContentPlugin<DSLExtension>[]
> = {
  name: string;
  version: string;
  author: string;
  packageName: string;
  renderer: () => Promise<{
    default: ThemeRenderer<Settings>;
  }>;
  getTextContent: () => TranslationFile;
  settings: Settings;
  extensions: Extensions;
};

export type Theme<
  Settings extends ThemeSettings,
  Extensions extends ContentPlugin<DSLExtension>[]
> = (
  name: string,
  settings: Partial<Settings>
) => ThemeDefinition<Settings, Extensions>;
