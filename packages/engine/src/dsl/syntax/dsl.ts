import { BaseContentPlugin } from "../types/plugins";
import { GameDefinition } from "../types/settings";
import { GameSettings, GameWorld } from "../types/world";
import {
  DisplayObjectInterface,
  LocationObject,
  OverlayObject,
  SceneScript,
} from "./script";

export type GameData<
  Game extends GameWorld<number>,
  Plugins extends readonly BaseContentPlugin[] = []
> = {
  settings: GameDefinition<Game>;
  overlays: Partial<
    Record<keyof Game["overlays"], OverlayObject<Game, string, Plugins>>
  >;
  locations: Partial<
    Record<keyof Game["locations"], LocationObject<Game, string, Plugins>>
  >;
  scenes: Partial<Record<Game["scenes"], SceneScript<Game, Plugins>>>;
  displayObjects: Partial<{
    [K in keyof Game["displayObjects"]]: DisplayObjectInterface<Game, K>;
  }>;
  plugins: Plugins;
};

export type BaseDSL<
  Version extends number,
  Game extends GameWorld<Version>,
  Settings extends GameSettings<Version>,
  Plugins extends readonly BaseContentPlugin[]
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

  defineScene: <Scene extends Game["scenes"]>(
    id: Scene,
    script: SceneScript<Game, Plugins>
  ) => void;

  // define game screen? (title screen, game over screen, settings screen, save screen, load screen)
  // define display object? (characters, poses, states, etc) content + state + actions + render
  defineDisplayObject: <DisplayObject extends keyof Game["displayObjects"]>(
    id: DisplayObject,
    displayObject: DisplayObjectInterface<Game, DisplayObject>
  ) => void;

  compile: () => GameData<Game, Plugins>;
};

export type GameWorldDSL<
  Version extends number,
  Game extends GameWorld<Version>,
  Settings extends GameSettings<Version>,
  Plugins extends readonly BaseContentPlugin[] = []
> = BaseDSL<Version, Game, Settings, Plugins>;

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
  Settings extends GameSettings<number>,
  Plugins extends readonly BaseContentPlugin[]
>(
  settings: GameDefinition<Game>,
  plugins: Plugins
): GameWorldDSL<Game["version"], Game, Settings, Plugins> => {
  let gameData: GameData<Game, Plugins> = {
    settings,
    overlays: {},
    locations: {},
    scenes: {},
    displayObjects: {},
    plugins,
  };

  return {
    defineOverlay: (id, overlayObject) => {
      gameData.overlays[id] = overlayObject;
    },
    defineLocation: (id, locationObject) => {
      gameData.locations[id] = locationObject;
    },
    defineScene: (id, script) => {
      gameData.scenes[id] = script;
    },
    defineDisplayObject: (id, displayObject) => {
      gameData.displayObjects[id] = displayObject;
    },
    compile: () => {
      return gameData;
    },
  };
};
