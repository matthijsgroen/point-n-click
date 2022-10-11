import { StateCondition } from "./ast-types";

/**
 * A game object holding state.
 * It can be a general state,
 *
 * `states: "sick" | "healed" | "happy";`
 *
 * or flags:
 *
 * `flags: "visited" | "inInventory";`
 *
 * or a counter:
 *
 * `counters: "coins" | "score";`
 */
export type WorldObjectSettings = {
  /**
   *
   */
  states?: unknown;
  flags?: unknown;
  counters?: unknown;
};

export type GameWorld = {
  /**
   * Locations you can visit in the game
   */
  locations: Record<string, WorldObjectSettings>;
  /**
   * Characters you can meet in the game
   */
  characters: Record<string, WorldObjectSettings>;
  /**
   * Items you can encounter in the game. Could be inventory, knowledge.
   */
  items: Record<string, WorldObjectSettings>;
  /**
   * Definition of overlays of the game.
   * Can be inventory management, conversation happening in the foreground,
   * a puzzle to solve, lock to pick.
   */
  overlays: unknown;
};

export type Script = () => void;

export type LocationScript<
  Game extends GameWorld,
  Location extends keyof Game["locations"]
> = (events: {
  onEnter: (
    from: Exclude<keyof Game["locations"], Location>,
    script: Script
  ) => void;
  onLeave: (
    from: Exclude<keyof Game["locations"], Location>,
    script: Script
  ) => void;
  describe: (script: () => void) => void;
  interaction: Interaction<Game>;
}) => void;

export type OverlayScript<Game extends GameWorld> = (events: {
  onEnter: (script: Script) => void;
  onLeave: (script: Script) => void;
  interaction: Interaction<Game>;
  closeOverlay: () => void;
}) => void;

export type EvaluateCondition<Game extends GameWorld> = (
  condition: StateCondition<Game>,
  script: Script,
  elseScript?: Script
) => void;

export type Interaction<Game extends GameWorld> = (
  text: string,
  condition: StateCondition<Game>,
  script: Script
) => void;
