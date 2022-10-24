import produce from "immer";
import { GameWorld } from "@point-n-click/types";
import { GameStateManager } from "@point-n-click/state";
import { cls, keypress, stopSkip } from "./utils";
import { renderText } from "./renderText";
import {
  FormattedText,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";

type TextInteraction = {
  label: FormattedText;
  id: string;
  key: string;
};

export const handleInteractions = async <Game extends GameWorld>(
  interactions: Interactions,
  stateManager: GameStateManager<Game>,
  modelManager: GameModelManager<Game>
) => {
  console.log(interactions.prompt);

  const textInteractions = interactions.actions.map<TextInteraction>(
    ({ label, id }, key) => ({
      label,
      id,
      key: `${key + 1}`,
    })
  );

  for (const interaction of textInteractions) {
    let text: FormattedText = [
      { type: "text", text: `${interaction.key}) ` },
      ...interaction.label,
    ];
    const cpm = stateManager.getState().settings.cpm;
    await renderText(text, cpm, {});
  }

  let chosenAction: TextInteraction | undefined;
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
    chosenAction = textInteractions.find(
      (interaction) => interaction.key === input
    );
  } while (!chosenAction);
  cls();
  stateManager.updateState(
    produce((state) => {
      state.currentInteraction = chosenAction?.id;
    })
  );
  stateManager.updateSaveState();
};
