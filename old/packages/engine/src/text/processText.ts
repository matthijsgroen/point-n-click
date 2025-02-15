import { GameWorld, GameStateManager, GameModel } from "@point-n-click/types";
import { getTranslationText } from "./getTranslationText";
import { parse } from "./parser";
import { FormattedText, ParsedText } from "./types";
import { applyGameState } from "./applyState";

export const parseText = (text: string): ParsedText => {
  try {
    return parse(text);
  } catch (e) {
    if (isParseError(e)) {
      e.text = text;
    }

    throw e;
  }
};

export const getDisplayText = <Game extends GameWorld>(
  sentence: string,
  stateManager: GameStateManager<Game>,
  model: GameModel<Game>,
  textScope: string[],
  stateScope: string[]
): FormattedText => {
  const renderSentence = getTranslationText(textScope, sentence) || sentence;
  const parsedText = parseText(renderSentence);
  return applyGameState(parsedText, stateManager, model, stateScope);
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

export const isParseError = (e: unknown): e is ParseSyntaxError =>
  (e as ParseSyntaxError).name === "SyntaxError";
