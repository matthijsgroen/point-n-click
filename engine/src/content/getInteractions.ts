import { GameStateManager, testCondition } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { GameModelManager } from "../model/gameModel";
import { getTranslationText } from "../text/getTranslationText";
import { getCurrentOverlay } from "./getOverlay";
import { DEFAULT_ACTION_PROMPT } from "./constants";
import { getDisplayText } from "../text/processText";
import { FormattedText } from "../text/types";
import { determineTextScope } from "../text/determineTextScope";

export type InteractionAction = {
  label: FormattedText;
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
  const currentLocation = stateManager.getState().currentLocation;
  const locationData = gameModelManager
    .getModel()
    .locations.find((l) => l.id === currentLocation);

  const interactions = currentOverlayData
    ? currentOverlayData.interactions
    : locationData?.interactions ?? [];

  const prompt =
    getTranslationText(["settings"], "defaultActionPrompt") ??
    gameModelManager.getModel().settings.defaultActionPrompt ??
    DEFAULT_ACTION_PROMPT;

  const possibleInteractions = interactions
    .filter((interaction) => testCondition(interaction.condition, stateManager))
    .map<InteractionAction>(({ label }) => ({
      label: getDisplayText(label, stateManager, textScope, textScope),
      id: label,
    }));

  return {
    prompt,
    actions: possibleInteractions,
  };
};
