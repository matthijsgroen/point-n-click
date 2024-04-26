import { testCondition } from "@point-n-click/state";
import { GameWorld, GameStateManager } from "@point-n-click/types";
import { GameModelManager } from "../model/gameModel";
import { getTranslationText } from "../text/getTranslationText";
import { getCurrentOverlay } from "./getOverlay";
import { DEFAULT_ACTION_PROMPT } from "./constants";
import { getDisplayText } from "../text/processText";
import { FormattedText } from "../text/types";
import { determineTextScope } from "../text/determineTextScope";
import { getCurrentLocation } from "./getLocation";

export type InteractionAction = {
  label: FormattedText;
  shortcutKey?: string;
  isGlobal: boolean;
  id: string;
};

export type Interactions = {
  prompt: string;
  actions: InteractionAction[];
};

export const getInteractions = <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  state: GameStateManager<Game>
): Interactions => {
  const currentOverlayData = getCurrentOverlay(gameModelManager, state);

  const textScope = determineTextScope(state, "interactions");
  const locationData = getCurrentLocation(gameModelManager, state);

  const interactions = currentOverlayData
    ? currentOverlayData.interactions
    : locationData?.interactions ?? [];

  const actionPrompt = (currentOverlayData?.prompts ?? [])
    .concat(locationData?.prompts ?? [])
    .find(
      (prompt) =>
        prompt.condition === undefined || testCondition(prompt.condition, state)
    );

  const translatedPrompt = actionPrompt
    ? getTranslationText(["prompts"], actionPrompt.prompt)
    : undefined;

  const prompt =
    translatedPrompt ??
    getTranslationText(["settings"], "defaultActionPrompt") ??
    gameModelManager.getModel().settings.defaultActionPrompt ??
    DEFAULT_ACTION_PROMPT;

  const globalInteractions = gameModelManager
    .getModel()
    .globalInteractions.filter((interaction) =>
      testCondition(interaction.condition, state)
    )
    .map<InteractionAction>(({ label, shortcutKey }) => ({
      label: getDisplayText(
        getTranslationText(["global", "interactions", label], "label") || label,
        state,
        gameModelManager.getModel(),
        [],
        textScope
      ),
      shortcutKey:
        getTranslationText(["global", "interactions", label], "shortcutKey") ||
        shortcutKey,
      isGlobal: true,
      id: label,
    }));

  const possibleInteractions = interactions
    .filter((interaction) => testCondition(interaction.condition, state))
    .map<InteractionAction>(({ label, shortcutKey }) => ({
      label: getDisplayText(
        label,
        state,
        gameModelManager.getModel(),
        textScope,
        textScope
      ),
      shortcutKey: shortcutKey
        ? getTranslationText([...textScope, "shortcutKeys"], label) ||
          shortcutKey
        : undefined,
      isGlobal: false,
      id: label,
    }));

  return {
    prompt,
    actions: globalInteractions.concat(possibleInteractions),
  };
};
