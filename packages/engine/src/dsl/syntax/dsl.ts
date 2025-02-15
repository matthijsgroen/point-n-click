import { ContentPlugin, DSLExtension } from "../types/plugins";
import { Settings } from "../types/settings";
import { GameWorld } from "../types/world";
import { LocationObject, OverlayObject } from "./script";

export type GameData<
  Game extends GameWorld<number>,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[] = []
> = {
  settings: Settings<Game>;
  overlays: Partial<
    Record<keyof Game["overlays"], OverlayObject<Game, string, Plugins>>
  >;
  locations: Partial<
    Record<keyof Game["locations"], LocationObject<Game, string, Plugins>>
  >;
  plugins: Plugins;
};

export type BaseDSL<
  Version extends number,
  Game extends GameWorld<Version>,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[]
> = {
  /**
   * # Overlay
   *
   * Define overlay content. Useful for inventory management,
   * character conversations, etc. Overlays can be stacked,
   * so you could open your inventory while in an character conversation.
   *
   * Functions available in overlayScript:
   *
   * - onEnter
   * - onLeave
   * - closeOverlay
   * - hasState
   * - setState
   */
  defineOverlay: <Overlay extends keyof Game["overlays"]>(
    id: Overlay,
    overlayObject: OverlayObject<Game, Overlay, Plugins>
  ) => void;

  defineLocation: <Location extends keyof Game["locations"]>(
    id: Location,
    locationObject: LocationObject<Game, Location, Plugins>
  ) => void;

  compile: () => GameData<Game, Plugins>;
};

export type GameWorldDSL<
  Version extends number,
  Game extends GameWorld<Version>,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[] = []
> = BaseDSL<Version, Game, Plugins>;

/**
 * This is the starting point of your adventure.
 *
 * `world` converts a model of a game world into
 * a domain specific language to define your game's content.
 *
 * @param settings
 * @returns
 */
export const world = <
  Game extends GameWorld<number>,
  Plugins extends readonly ContentPlugin<string, DSLExtension>[]
>(
  settings: Settings<Game>,
  plugins: Plugins
): GameWorldDSL<Game["version"], Game, Plugins> => {
  const gameData: GameData<Game, Plugins> = {
    settings,
    overlays: {},
    locations: {},
    plugins,
  };

  return {
    defineOverlay: (id, overlayObject) => {
      gameData.overlays[id] = overlayObject;
    },
    defineLocation: (id, locationObject) => {
      gameData.locations[id] = locationObject;
    },
    compile: () => {
      return gameData;
    },
  };
};
