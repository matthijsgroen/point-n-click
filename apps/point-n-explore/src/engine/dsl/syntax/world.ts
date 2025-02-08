import { Settings } from "../types/settings";
import { GameWorld } from "../types/world";
import { OverlayObject } from "./script";

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

  compile: () => unknown;
};

type GameWorldDSL<
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
  console.log("Hello world");
  return {
    defineOverlay: (id, overlayObject) => {
      console.log("Define overlay", id, overlayObject);
    },
    compile: () => {
      console.log("Compile");
    },
  };
};
