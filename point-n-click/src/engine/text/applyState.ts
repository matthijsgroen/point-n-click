import { GameStateManager } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { FormattedText, ParsedText } from "./types";

export type StateError = Error & {
  name: "StateError";
  stateKey: string;
};

export const applyState = <Game extends GameWorld>(
  text: ParsedText,
  stateManager: GameStateManager<Game>,
  stateScope: string[]
): FormattedText => {
  const result: FormattedText = [];
  for (const element of text) {
    if (element.type === "text") {
      result.push(element);
    }
    if (element.type === "formatting") {
      result.push({
        ...element,
        contents: applyState(element.contents, stateManager, stateScope),
      });
    }
    if (element.type === "interpolation") {
      const statePath = element.value.split(".");
      const resolveStatePath =
        statePath[0] === ""
          ? [...stateScope].concat(statePath.slice(1))
          : statePath;

      const state = stateManager.getState();
      const error = new Error(`STATE NOT FOUND '${element.value}'`);
      (error as StateError).name = "StateError";
      (error as StateError).stateKey = element.value;

      let value = `STATE NOT FOUND '${element.value}'`;

      if (resolveStatePath[0] === "character") {
        const character = resolveStatePath[1] as keyof Game["characters"];
        const property = resolveStatePath[2];

        if (!state.characters[character]) {
          throw error;
        }
        if (property === "defaultName") {
          value = state.characters[character].defaultName;
        }
        if (property === "name") {
          value =
            state.characters[character].name ||
            state.characters[character].defaultName;
        }
        if (property === "counters") {
          const valueKey = resolveStatePath[3];
          value = String(state.characters[character].counters[valueKey] ?? 0);
        }
      }
      if (value === `STATE NOT FOUND '${element.value}'`) {
        throw error;
      }

      result.push({
        type: "text",
        text: value,
      });
    }
  }
  return result;
};
