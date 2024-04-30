import { PuzzleDependencyDiagram } from "@point-n-click/puzzle-dependency-diagram";
import { GameInteraction, GameLocation, GameOverlay } from "./ast";
import { ColorPalette, PaletteColor } from "./colorPalette";
import { GameWorld } from "./world";
import { GameState } from "./state";
import { WorldMap } from "./map";

export type RecursivePartial<T extends Record<string, unknown>> = {
  [Key in keyof T]?: T[Key] extends Record<string, unknown>
    ? RecursivePartial<T[Key]>
    : T[Key];
};

export type JSONValue =
  | null
  | string
  | boolean
  | number
  | Array<JSONValue>
  | { [x: string]: JSONValue };

export type GameCredit = {
  role: string;
  names: string[];
};

export type ThemeInfo = {
  name: string;
  themePackage: string;
  settings: JSONValue;
};

export type Locale = `${string}-${string}`;

export type Settings<Game extends GameWorld> = {
  /**
   * The title of your game. Displayed on the title screen
   * and as title of the webpage / browser tab.
   */
  gameTitle: string;
  subTitle?: string;
  meta?: {
    author?: string;
    description?: string;
    credits?: GameCredit[];
  };
  /**
   * List of supported locales. These are the locales the user can choose in the
   * interface, and the locales that will be bundled when packaging the game.
   *
   * When translating to a new language you can also set a language using the command line.
   */
  locales: {
    default: Locale;
    supported: { [key: Locale]: string };
  };
  initialState: RecursivePartial<GameState<Game>> & {
    version: Game["version"];
  };
  colors: {
    defaultTextColor?: PaletteColor;
    lightPalette: ColorPalette;
    darkPalette: ColorPalette;
  };
  defaultActionPrompt?: string;
  characterConfigs: Record<
    keyof Game["characters"],
    {
      defaultName: string;
      textColor?: PaletteColor;
    }
  >;
};

export type GameModel<Game extends GameWorld> = {
  settings: Settings<Game>;
  locations: GameLocation<Game>[];
  overlays: GameOverlay<Game>[];
  globalInteractions: GameInteraction<Game>[];
  themes: ThemeInfo[];
  diagram: PuzzleDependencyDiagram;
  worldMap: WorldMap<Game>;
};
