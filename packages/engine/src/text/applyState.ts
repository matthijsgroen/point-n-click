import {
  GameWorld,
  GameStateManager,
  GameState,
  GameModel,
  StateText,
} from "@point-n-click/types";
import { getTranslationText } from "./getTranslationText";
import { FormattedText, ParsedText } from "./types";

export type StateError = Error & {
  name: "StateError";
  sentence: string;
  stateKey: string;
};

export const isStateError = (e: unknown): e is StateError =>
  (e as StateError).name === "StateError";

const existingRootStates = ["items", "characters", "locations", "overlays"];
const existingCharacterProperties = [
  "name",
  "defaultName",
  "counters",
  "texts",
];

const existingItemProperties = ["counters", "texts"];

export const characterName = <Game extends GameWorld>(
  character: keyof Game["characters"],
  gameState: GameState<Game>,
  model: GameModel<Game>
): string => {
  const stateName = gameState.characters[character]?.name;
  const name =
    (stateName
      ? getTranslationText(
          ["characters", String(character), "names"],
          stateName
        )
      : null) ??
    stateName ??
    characterDefaultName(character, model);
  return name;
};

export const characterDefaultName = <Game extends GameWorld>(
  character: keyof Game["characters"],
  model: GameModel<Game>
): string =>
  getTranslationText(["characters", String(character)], "defaultName") ??
  model.settings.characterConfigs[character].defaultName;

const isRootLevelStateObject = (
  rootLevel: string
): rootLevel is "items" | "locations" | "overlays" =>
  ["items", "locations", "overlays"].includes(rootLevel);

export type Interpolator = (
  textElement: StateText,
  text: ParsedText
) => FormattedText;

const makeInterpolator =
  <Game extends GameWorld>(
    gameState: GameStateManager<Game>,
    model: GameModel<Game>,
    stateScope: string[]
  ): Interpolator =>
  (element, text) => {
    const result: FormattedText = [];
    const statePath = element.value.split(".");
    const resolveStatePath =
      statePath[0] === ""
        ? [...stateScope.slice(0, -1)].concat(statePath.slice(1))
        : statePath;

    const state = gameState.get();

    const throwStateError = (message: string) => {
      const error = new Error(message);
      (error as StateError).name = "StateError";
      (error as StateError).stateKey = element.value;
      (error as StateError).sentence = printParsed(text);
      throw error;
    };

    let value = `STATE NOT FOUND '${resolveStatePath.join(".")}'`;
    const rootLevel = resolveStatePath[0];
    if (!existingRootStates.includes(rootLevel)) {
      throwStateError(
        `${value} ${rootLevel} does not exist. Do you mean one of ${existingRootStates.join(
          ","
        )}`
      );
    }

    if (rootLevel === "characters") {
      const character = resolveStatePath[1] as keyof Game["characters"];
      const property = resolveStatePath[2];

      if (!state.characters[character]) {
        throwStateError(
          `${value} ${String(
            character
          )} does not exist. Do you mean one of ${Object.keys(
            state.characters
          ).join(",")}`
        );
      }
      if (!existingCharacterProperties.includes(property)) {
        throwStateError(
          `${value} ${property} does not exist. Do you mean one of ${existingCharacterProperties.join(
            ","
          )}`
        );
      }

      if (property === "defaultName") {
        value = characterDefaultName(character, model);
      }
      if (property === "name") {
        value = characterName(character, state, model);
      }
      if (property === "counters") {
        const characterCounters = state.characters[character].counters;
        type CounterKey = keyof typeof characterCounters;
        const valueKey = resolveStatePath[3] as CounterKey;
        value = String(characterCounters?.[valueKey] ?? 0);
      }
      if (property === "texts") {
        const itemText = state.characters[character]?.texts;
        type TextKey = keyof typeof itemText;
        const valueKey = resolveStatePath[3] as TextKey;
        if (itemText) {
          const text = String(itemText[valueKey] ?? false);
          if (text) {
            value =
              getTranslationText(
                ["character", String(character), "texts", String(valueKey)],
                text
              ) || text;
          }
        }
      }
    }

    if (isRootLevelStateObject(rootLevel)) {
      const item = resolveStatePath[1] as keyof Game["items"];
      const property = resolveStatePath[2];

      if (!state[rootLevel][item]) {
        throwStateError(
          `${value} ${String(
            item
          )} does not exist. Do you mean one of ${Object.keys(
            state[rootLevel]
          ).join(",")}`
        );
      }
      if (!existingItemProperties.includes(property)) {
        throwStateError(
          `${value} ${property} does not exist. Do you mean one of ${existingItemProperties.join(
            ","
          )}`
        );
      }
      if (property === "counters") {
        const itemCounter = state[rootLevel][item]?.counters;
        type CounterKey = keyof typeof itemCounter;
        if (itemCounter) {
          const valueKey = resolveStatePath[3] as CounterKey;
          value = String(itemCounter[valueKey] ?? 0);
        }
      }
      if (property === "texts") {
        const itemText = state[rootLevel][item]?.texts;
        type TextKey = keyof typeof itemText;
        const valueKey = resolveStatePath[3] as TextKey;
        if (itemText) {
          const text = itemText[valueKey];
          value =
            getTranslationText(
              ["item", String(item), "texts", String(valueKey)],
              text
            ) || text;
        }
      }
    }
    if (value === `STATE NOT FOUND '${element.value}'`) {
      throwStateError(value);
    }

    result.push({
      type: "text",
      text: value,
    });
    return result;
  };

export const applyGameState = <Game extends GameWorld>(
  text: ParsedText,
  gameState: GameStateManager<Game>,
  model: GameModel<Game>,
  stateScope: string[]
): FormattedText => {
  const interpolator = makeInterpolator(gameState, model, stateScope);

  return applyState(text, interpolator);
};

export const applyState = (
  text: ParsedText,
  interpolator: Interpolator
): FormattedText => {
  const result: FormattedText = [];
  for (const element of text) {
    if (element.type === "text") {
      result.push(element);
    }
    if (element.type === "formatting") {
      result.push({
        ...element,
        contents: applyState(element.contents, interpolator),
      });
    }
    if (element.type === "interpolation") {
      result.push(...interpolator(element, text));
    }
  }
  return result;
};

export const printParsed = (text: ParsedText): string => {
  return text
    .map((e) => {
      if (e.type === "text") return e.text;
      if (e.type === "interpolation") return `[${e.value}]`;
      if (e.type === "formatting") {
        // TODO Add support for value
        return `{${e.format}}${printParsed(e.contents)}{/${e.format}}`;
      }
    })
    .join("");
};
