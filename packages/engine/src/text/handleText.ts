import {
  GameWorld,
  GameStateManager,
  DisplayErrorText,
  GameModel,
} from "@point-n-click/types";
import { formatParserError, formatStateError } from "../errors/formatErrors";
import { isStateError } from "./applyState";
import { determineTextScope } from "./determineTextScope";
import { getDisplayText, isParseError } from "./processText";
import { FormattedText } from "./types";

export const handleTextContent = <Game extends GameWorld>(
  stateManager: GameStateManager<Game>,
  model: GameModel<Game>,
  sentences: string[],
  textScope: string
): { result: FormattedText[]; error: DisplayErrorText | null } => {
  const fullTextScope = determineTextScope(stateManager, textScope);
  const text: FormattedText[] = [];
  for (const sentence of sentences) {
    try {
      text.push(
        getDisplayText(
          sentence,
          stateManager,
          model,
          fullTextScope,
          fullTextScope
        )
      );
    } catch (e) {
      if (isParseError(e)) {
        return {
          result: text,
          error: formatParserError(e),
        };
      }
      if (isStateError(e)) {
        return {
          result: text,
          error: formatStateError(e),
        };
      }
      break;
    }
  }
  return { result: text, error: null };
};
