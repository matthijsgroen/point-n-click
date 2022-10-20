import { DisplayInfo, Interactions } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";

export type ThemeRenderer = React.FC<{
  contents: DisplayInfo<GameWorld>[];
  interactions: Interactions;
}>;

export type Theme = {
  name: string;
  version: string;
  author: string;
  render: ThemeRenderer;
};
