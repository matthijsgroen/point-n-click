import { GameWorld, GameState } from "@point-n-click/types";

/**
 * Merges two game states. The locations and characters
 * of state 'a' will be leading,
 * while the values in state 'b' of those locations and
 * characters will be leading.
 * Since item states are flexible, item states of 'b' will be leading.
 */
export const mergeState = <Game extends GameWorld>(
  a: GameState<Game>,
  b: GameState<Game>
): GameState<Game> => ({
  ...b,
  characters: Object.fromEntries(
    Object.entries(a.characters).map(([char, charData]) => {
      return [char, { ...charData, ...b.characters[char] }];
    })
  ) as GameState<Game>["characters"],
  locations: Object.fromEntries(
    Object.entries(a.locations).map(([location, locationData]) => {
      return [location, { ...locationData, ...b.locations[location] }];
    })
  ) as GameState<Game>["locations"],
  overlays: Object.fromEntries(
    Object.entries(a.overlays).map(([overlay, overlayData]) => {
      return [overlay, { ...overlayData, ...b.overlays[overlay] }];
    })
  ) as GameState<Game>["overlays"],
});
