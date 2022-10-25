import { GameWorld } from "@point-n-click/types";
import type { FC } from "react";
import {
  DisplayInfo,
  FormattedText,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";

export type ThemeRenderer<Settings extends Record<string, unknown>> = FC<{
  settings: Settings;
  contents: DisplayInfo<GameWorld>[];
  interactions: Interactions;
  skipToStep: number;
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

export const formatText = (text: FormattedText) =>
  text.map((node, index): React.ReactNode => {
    if (node.type === "text") {
      return node.text;
    } else {
      if (node.format === "b") {
        return <strong key={index}>{formatText(node.contents)}</strong>;
      }
      if (node.format === "i") {
        return <em key={index}>{formatText(node.contents)}</em>;
      }
      return formatText(node.contents);
    }
  });
