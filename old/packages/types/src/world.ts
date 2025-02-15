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
  states?: string;
  flags?: string;
  counters?: string;
  texts?: string;
};

export type GameWorld<Version extends number = number> = {
  version: Version;
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
  lists: Record<string, string>;
  /**
   * Definition of overlays of the game.
   * Can be inventory management, conversation happening in the foreground,
   * a puzzle to solve, lock to pick.
   */
  overlays: Record<string, WorldObjectSettings>;
  scenes: string;
};
