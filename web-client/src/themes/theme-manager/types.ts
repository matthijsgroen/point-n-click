import {
  DisplayInfo,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";

export type ThemeRenderer<Settings extends Record<string, unknown>> = React.FC<{
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
};
