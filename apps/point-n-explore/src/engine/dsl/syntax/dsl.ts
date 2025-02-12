import { Settings } from "../types/settings";
import { GameWorld } from "../types/world";
import { LocationObject, OverlayObject } from "./script";

export type GameData<Game extends GameWorld<number>> = {
  settings: Settings<Game>;
  overlays: Partial<
    Record<keyof Game["overlays"], OverlayObject<Game, string>>
  >;
  locations: Partial<
    Record<keyof Game["locations"], LocationObject<Game, string>>
  >;
};

type BaseDSL<Version extends number, Game extends GameWorld<Version>> = {
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
    overlayObject: OverlayObject<Game, Overlay>
  ) => void;

  defineLocation: <Location extends keyof Game["locations"]>(
    id: Location,
    locationObject: LocationObject<Game, Location>
  ) => void;

  compile: () => GameData<Game>;
};

export type GameWorldDSL<
  Version extends number,
  Game extends GameWorld<Version>
> = BaseDSL<Version, Game>;

/**
 * This is the starting point of your adventure.
 *
 * `world` converts a model of a game world into
 * a domain specific language to define your game's content.
 *
 * @param settings
 * @returns
 */
export const world = <Game extends GameWorld<number>>(
  settings: Settings<Game>
): GameWorldDSL<Game["version"], Game> => {
  const gameData: GameData<Game> = {
    settings,
    overlays: {},
    locations: {},
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
