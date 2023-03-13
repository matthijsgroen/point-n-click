import { GameWorld, GameStateManager } from "@point-n-click/types";
import { getTranslationText } from "./getTranslationText";
import { parse } from "./parser";
import { FormattedText, ParsedText } from "./types";
import { applyState } from "./applyState";

export const parseText = (text: string): ParsedText => {
  try {
    return parse(text);
  } catch (e) {
    if ((e as ParseSyntaxError).name === "SyntaxError") {
      (e as ParseSyntaxError).text = text;
    }

    throw e;
  }
};

export const getDisplayText = <Game extends GameWorld>(
  sentence: string,
  stateManager: GameStateManager<Game>,
  textScope: string[],
  stateScope: string[]
): FormattedText => {
  const renderSentence = getTranslationText(textScope, sentence) || sentence;
  const parsedText = parseText(renderSentence);
  return applyState(parsedText, stateManager, stateScope);
};

export type ParseSyntaxError = Error & {
  location: {
    start: {
      offset: number;
    };
  };
  found: string;
  text: string;
};
