import { GameStateManager } from "../state/types";
import { GameWorld } from "../../dsl/world-types";
import { getTranslationText } from "./getTranslationText";
import { parse } from "./parser";
import { FormattedText, ParsedText } from "./types";
import { applyState, StateError } from "./applyState";
import { resetStyling } from "../../cli-client/utils";

const parseText = (text: string): ParsedText => {
  return parse(text);
};

export const getDisplayText = <Game extends GameWorld>(
  sentence: string,
  stateManager: GameStateManager<Game>,
  textScope: string[],
  stateScope: string[]
): FormattedText => {
  const renderSentence = getTranslationText(textScope, sentence) || sentence;
  // 1: Parse text
  const parsedText = parseText(renderSentence);
  // 2: Apply state
  return applyState(parsedText, stateManager, stateScope);
};

export type ParseSyntaxError = Error & {
  location: {
    start: {
      offset: number;
    };
  };
  found: string;
};
