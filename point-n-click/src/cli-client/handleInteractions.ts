import produce from "immer";
import { GameInteraction, GameWorld } from "@point-n-click/types";
import { GameStateManager, testCondition } from "@point-n-click/state";
import { cls, keypress, stopSkip } from "./utils";
import { renderText } from "./renderText";
import {
  FormattedText,
  GameModelManager,
  getTranslationText,
  determineTextScope,
  getDisplayText,
} from "@point-n-click/engine";
import { DEFAULT_ACTION_PROMPT } from "./constants";

export const handleInteractions = async <Game extends GameWorld>(
  interactions: GameInteraction<Game>[],
  stateManager: GameStateManager<Game>,
  modelManager: GameModelManager<Game>
) => {
  console.log(
    getTranslationText(["settings"], "defaultActionPrompt") ??
      modelManager.getModel().settings.defaultActionPrompt ??
      DEFAULT_ACTION_PROMPT
  );

  const possibleInteractions = interactions
    .filter((interaction) => testCondition(interaction.condition, stateManager))
    .map((action, key) => ({
      action,
      key: `${key + 1}`,
    }));

  const textScope = determineTextScope(stateManager, "interactions");

  for (const interaction of possibleInteractions) {
    let text: FormattedText = [
      { type: "text", text: `${interaction.key}) ` },
      ...getDisplayText(
        interaction.action.label,
        stateManager,
        textScope,
        textScope
      ),
    ];
    const cpm = stateManager.getState().settings.cpm;
    await renderText(text, cpm, {});
  }

  let chosenAction: { action: GameInteraction<Game>; key: string } | undefined;
  stopSkip();
  do {
    const input = await Promise.race([
      keypress(),
      modelManager.waitForChange(),
    ]);
    if (typeof input === "boolean") {
      stateManager.setPlayState("reloading");
      return;
    }

    // input = await keypress();
    if (input === "q") {
      stateManager.setPlayState("quitting");
    }
    if (input === "r") {
      stateManager.setPlayState("reloading");
    }
    if (stateManager.isAborting()) {
      return;
    }
    chosenAction = possibleInteractions.find(
      (interaction) => interaction.key === input
    );
  } while (!chosenAction);
  cls();
  stateManager.updateState(
    produce((state) => {
      state.currentInteraction = chosenAction?.action.label;
    })
  );
  stateManager.updateSaveState();
};
