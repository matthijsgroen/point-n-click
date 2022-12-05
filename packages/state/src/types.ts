import {
  GameInteraction,
  GameLocation,
  GameOverlay,
  GameState,
  GameWorld,
} from "@point-n-click/types";
import { HexColor } from "./hexColor";

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
   * The locale used for writing all the game's content.
   * This means all translation keys of the other language files
   * will also be in this locale.
   */
  defaultLocale: `${string}-${string}`;
  /**
   * List of supported locales. These are the locales the user can choose in the
   * interface, and the locales that will be bundled when packaging the game.
   *
   * When translating to a new language you can also set a language using the command line.
   */
  supportedLocales?: `${string}-${string}`[];
  initialState: RecursivePartial<GameState<Game>>;
  defaultTextColor?: HexColor;
  defaultActionPrompt?: string;
  characterConfigs: Record<
    keyof Game["characters"],
    {
      defaultName: string;
      textColor?: HexColor;
    }
  >;
};

export type GameModel<Game extends GameWorld> = {
  settings: Settings<Game>;
  locations: GameLocation<Game>[];
  overlays: GameOverlay<Game>[];
  globalInteractions: GameInteraction<Game>[];
  themes: ThemeInfo[];
};
