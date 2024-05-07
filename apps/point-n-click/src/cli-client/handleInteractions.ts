import { produce } from "immer";
import { GameWorld, GameSaveStateManager } from "@point-n-click/types";
import { keypress, stopSkip } from "./utils";
import { renderText } from "./renderText";
import {
  FormattedText,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { saveProgress } from "./saveGame";

type TextInteraction = {
  label: FormattedText;
  id: string;
  key: string;
  isGlobal: boolean;
};

const globalColor = (active: boolean, text: FormattedText): FormattedText =>
  active
    ? [{ type: "formatting", format: "color", value: "777777", contents: text }]
    : text;

export const handleInteractions = async <Game extends GameWorld>(
  interactions: Interactions,
  stateManager: GameSaveStateManager<Game>,
  modelManager: GameModelManager<Game>,
  clearScreen: () => void
) => {
  console.log("");
  console.log(interactions.prompt);
  console.log("");

  let key = 0;
  const keyList = "123456789abcdefghijkl";
  const textInteractions = interactions.actions.map<TextInteraction>(
    ({ label, id, shortcutKey, isGlobal }) => ({
      label,
      id,
      isGlobal,
      key: `${shortcutKey || keyList.slice(key++, key)}`,
    })
  );

  for (const interaction of textInteractions) {
    let text: FormattedText = globalColor(interaction.isGlobal, [
      { type: "text", text: `${interaction.key.toUpperCase()}) ` },
      ...interaction.label,
    ]);
    const cpm = stateManager.activeState().get().settings.cpm;
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
    if (input === "m") {
      stateManager.setPlayState("pausing");
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
  clearScreen();
  stateManager.activeState().update(
    produce((state) => {
      state.currentInteraction = chosenAction?.id;
      state.lastInteractionAt = Date.now();
      state.inputs = {};
    })
  );
  stateManager.updateSaveState();
  await saveProgress(stateManager);
};
