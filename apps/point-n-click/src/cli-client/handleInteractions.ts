import { produce } from "immer";
import { GameWorld, GameStateManager } from "@point-n-click/types";
import { keypress, stopSkip } from "./utils";
import { renderText } from "./renderText";
import {
  FormattedText,
  GameModelManager,
  Interactions,
} from "@point-n-click/engine";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

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
  stateManager: GameStateManager<Game>,
  modelManager: GameModelManager<Game>,
  clearScreen: () => void
) => {
  console.log("");
  console.log(interactions.prompt);
  console.log("");

  let key = 0;
  const textInteractions = interactions.actions.map<TextInteraction>(
    ({ label, id, shortcutKey, isGlobal }) => ({
      label,
      id,
      isGlobal,
      key: `${shortcutKey || ++key}`,
    })
  );

  for (const interaction of textInteractions) {
    let text: FormattedText = globalColor(interaction.isGlobal, [
      { type: "text", text: `${interaction.key.toUpperCase()}) ` },
      ...interaction.label,
    ]);
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
  clearScreen();
  stateManager.updateState(
    produce((state) => {
      state.currentInteraction = chosenAction?.id;
    })
  );
  stateManager.updateSaveState();

  const autoSavePath = join(process.cwd(), ".autosave.json");
  await writeFile(autoSavePath, JSON.stringify(stateManager.getSaveState()), {
    encoding: "utf-8",
  });
};
