import {
  ColorPalette,
  GameWorld,
  HexColor,
  PaletteColor,
} from "@point-n-click/types";
import { GameModelManager } from "./model/gameModel";

const getPalette = <Game extends GameWorld<number>>(
  gameModelManager: GameModelManager<Game>,
  palette: "light" | "dark"
): ColorPalette =>
  palette === "dark"
    ? gameModelManager.getModel().settings.colors.darkPalette
    : gameModelManager.getModel().settings.colors.lightPalette;

export const getPaletteColor =
  <Game extends GameWorld<number>>(
    gameModelManager: GameModelManager<Game>,
    palette: "light" | "dark"
  ) =>
  (color: PaletteColor | undefined): HexColor | undefined =>
    color ? getPalette(gameModelManager, palette)[color] : undefined;
