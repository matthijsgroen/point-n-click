import { getDisplayText } from "../engine/text/processText";
import { GameInteraction, GameModel } from "../dsl/ast-types";
import { GameStateManager } from "../engine/state/types";
import { GameWorld } from "../dsl/world-types";
import { cls, keypress, stopSkip } from "./utils";
import { determineTextScope } from "../engine/text/determineTextScope";
import { renderText } from "./renderText";
import { testCondition } from "../engine/state/testCondition";
import { FormattedText } from "../engine/text/types";
import produce from "immer";
import { GameModelManager } from "../engine/model/gameModel";

export const handleInteractions = async <Game extends GameWorld>(
  interactions: GameInteraction<Game>[],
  stateManager: GameStateManager<Game>,
  modelManager: GameModelManager<Game>
) => {
  // prompt: should be default configured, and can be redefined for overlays
  console.log("Wat ga je doen:");

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
