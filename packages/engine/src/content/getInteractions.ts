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
  stateManager: GameStateManager<Game>
): Interactions => {
  const currentOverlayData = getCurrentOverlay(gameModelManager, stateManager);

  const textScope = determineTextScope(stateManager, "interactions");
  const locationData = getCurrentLocation(gameModelManager, stateManager);

  const interactions = currentOverlayData
    ? currentOverlayData.interactions
    : locationData?.interactions ?? [];

  const actionPrompt = currentOverlayData
    ? currentOverlayData.prompt
    : locationData?.prompt;

  const translatedPrompt = actionPrompt
    ? getTranslationText(["prompts"], actionPrompt)
    : undefined;

  const prompt =
    translatedPrompt ??
    getTranslationText(["settings"], "defaultActionPrompt") ??
    gameModelManager.getModel().settings.defaultActionPrompt ??
    DEFAULT_ACTION_PROMPT;

  const globalInteractions = gameModelManager
    .getModel()
    .globalInteractions.filter((interaction) =>
      testCondition(interaction.condition, stateManager)
    )
    .map<InteractionAction>(({ label, shortcutKey }) => ({
      label: getDisplayText(
        getTranslationText(["global", "interactions", label], "label") || label,
        stateManager,
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
    .filter((interaction) => testCondition(interaction.condition, stateManager))
    .map<InteractionAction>(({ label }) => ({
      label: getDisplayText(
        label,
        stateManager,
        gameModelManager.getModel(),
        textScope,
        textScope
      ),
      isGlobal: false,
      id: label,
    }));

  return {
    prompt,
    actions: globalInteractions.concat(possibleInteractions),
  };
};
