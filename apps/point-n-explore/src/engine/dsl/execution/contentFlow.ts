import { GameState } from "../syntax/state";
import { GameWorld, StateObject } from "../types/world";
import { Action } from "./actions";
import { Interaction } from "./getInteractions";
import { mulberry32 } from "./random";

type Content<Game extends GameWorld> = {
  actions: Action<Game>[];
  prompt: string;
  interactions: Interaction<Game, StateObject, keyof Game[`${StateObject}s`]>[];
};

/**
 * Content flow
 *
 * Getting from a state to a list of content,
 * and possible interactions to perform
 *
 */
export const executeContentFlow = <Game extends GameWorld>(
  state: GameState<Game>
): Content<Game> => {
  /**
   * Flow of the 'point-n-click' version ('describeLocation')
   *
   * # DescribeLocation
   *
   * - Get the current location
   * - Get the previous location
   * - If the current location is different from the previous location
   *   - Run the 'onLeave' script of the previous location
   *   - Update the previous location
   *   - Run the 'onEnter' script of the current location
   * - Run the 'describe' script of the current location
   * - Update the previous location
   *
   * - Get the current overlay
   * - Run the 'onEnter' script of the current overlay
   *
   *
   * # GetDisplayInfo
   *
   * - If interaction is set
   * - Get the interaction data (from global or local overlay / location)
   * - Run the interaction script
   *
   * - If the interaction script changes the overlay
   *   - Run the 'onLeave' script of the current overlay
   *   - Update the current overlay
   * - If there is still an overlay set (not undefined)
   *   - Run the 'onEnter' script of the new overlay
   * - If there is no overlay set (and overlay was set before)
   *   - Describe the location (#DescribeLocation)
   *
   * - If location has changed and was not yet described
   *   - Describe the location (#DescribeLocation)
   *
   * - If no interaction is set
   *  - Describe the location (#DescribeLocation)
   *
   */
  const seed = state.lastInteractionAt ?? Date.now();

  const randomNumber = mulberry32(seed);

  return {
    actions: [],
    prompt: `Wat wil je met ${randomNumber()} doen?`,
    interactions: [],
  };
};
