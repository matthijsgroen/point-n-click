import {
  GameWorld,
  GameStateManager,
  DisplayErrorText,
  GameModel,
} from "@point-n-click/types";
import { formatParserError, formatStateError } from "../errors/formatErrors";
import { StateError } from "./applyState";
import { determineTextScope } from "./determineTextScope";
import { getDisplayText, ParseSyntaxError } from "./processText";
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
      if ((e as ParseSyntaxError).name === "SyntaxError") {
        return {
          result: text,
          error: formatParserError(e as ParseSyntaxError),
        };
      }
      if ((e as StateError).name === "StateError") {
        return {
          result: text,
          error: formatStateError(sentence, e as StateError),
        };
      }
      break;
    }
  }
  return { result: text, error: null };
};
