import produce from "immer";
import { GameInteraction, GameWorld } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/state";
import { getDisplayText } from "../engine/text/processText";
import { cls, keypress, stopSkip } from "./utils";
import { determineTextScope } from "../engine/text/determineTextScope";
import { renderText } from "./renderText";
import { testCondition } from "../../../state/src/testCondition";
import { FormattedText } from "../engine/text/types";
import { GameModelManager } from "../engine/model/gameModel";
import { getTranslationText } from "../engine/text/getTranslationText";
import { DEFAULT_ACTION_PROMPT } from "../dsl/constants";

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
    let text: FormattedText = [];
    text.push({ type: "text", text: `${interaction.key}) ` });
    text.push(
      ...getDisplayText(
        interaction.action.label,
        stateManager,
        textScope,
        textScope
      )
    );
    const cpm = stateManager.getState().settings.cpm;
    await renderText(text, cpm, {});
  }

  let input: string | undefined;
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
