import {
  DisplayInfo,
  FormattedText,
  GameModelManager,
  getPaletteColor,
  isContentPluginContent,
} from "@point-n-click/engine";
import {
  GameWorld,
  GameState,
  GameSaveStateManager,
  PatchFunction,
} from "@point-n-click/types";
import { renderText } from "./renderText";
import { getSettings } from "./settings";
import { isListItem, resetStyling, setColor } from "./utils";
import { saveProgress } from "./saveGame";
import { setDisplayType } from "./displayType";
import {
  handleDescriptionText,
  isDescriptionText,
} from "./plugin-support/descriptionText";
import { PluginProps } from "./plugin-support/types";
import {
  handleNotesLetters,
  isNoteLetters,
} from "./plugin-support/notes-letters";
import { handleRename, isCharacterRename } from "./plugin-support/rename";

export const renderDisplayInfo = async <Game extends GameWorld>(
  displayItem: DisplayInfo<Game>,
  gameModelManager: GameModelManager<Game>,
  stateManager: GameSaveStateManager<Game>,
  key: string,
  supplyPatch: (patch: PatchFunction<GameState<Game>>) => void,
  updateBorder: (newPrefix: FormattedText, newPostFix: FormattedText) => void,
  {
    lightMode,
    prefix,
    postfix,
  }: { lightMode: boolean; prefix: FormattedText; postfix: FormattedText }
): Promise<void> => {
  const useColor = getSettings().color;
  const textColor = useColor
    ? gameModelManager.getModel().settings.colors.defaultTextColor
    : undefined;

  const getColor = getPaletteColor(
    gameModelManager,
    lightMode ? "light" : "dark"
  );
  const options = { addNewLine: true, getColor };

  const state = stateManager.activeState();
  const renderEmptyLine = ({ pre, post } = { pre: prefix, post: postfix }) =>
    renderText(
      [{ type: "text", text: "" }],
      0,
      {
        prefix: pre,
        postfix: post,
      },
      options
    );

  if (isContentPluginContent(displayItem)) {
    const storeCustomInput = async <T>(
      getInput: () => Promise<T>,
      displayPreviousInput: (value: T) => Promise<void>
    ) => {
      const suppliedValue = state.get().inputs[key] as T | undefined;
      if (suppliedValue) {
        await displayPreviousInput(suppliedValue);
        return suppliedValue;
      } else {
        const newInput = await Promise.race([
          getInput(),
          gameModelManager.waitForChange(),
        ]);
        if (typeof newInput === "boolean") {
          stateManager.setPlayState("reloading");
          throw new Error("Reloading");
        }
        stateManager.storeInput(key, newInput);
        await saveProgress(stateManager);
        return newInput;
      }
    };

    const pluginProps: PluginProps<Game> = {
      gameModelManager,
      state,
      updateBorder,
      supplyPatch,
      renderEmptyLine,
      storeCustomInput,
      lightMode,
      prefix,
      postfix,
    };
    if (isDescriptionText(displayItem)) {
      await handleDescriptionText(displayItem, pluginProps);
    }

    if (isNoteLetters(displayItem)) {
      await handleNotesLetters(displayItem, pluginProps);
    }

    if (isCharacterRename(displayItem)) {
      await handleRename(displayItem, pluginProps);
    }
    return;
  }
  if (displayItem.type === "narratorText") {
    await setDisplayType("text", renderEmptyLine);
    for (const sentence of displayItem.text) {
      const color = getColor(textColor);
      await renderText(
        sentence,
        displayItem.cpm,
        {
          color,
          prefix,
          postfix,
          indent: isListItem(sentence) ? 2 : 0,
        },
        options
      );
    }
    resetStyling();
  } else if (displayItem.type === "characterText") {
    if (
      !Object.hasOwn(
        gameModelManager.getModel().settings.characterConfigs,
        displayItem.character
      )
    ) {
      stateManager.setPlayState("reloading");
      gameModelManager.backupModel();
    }

    const name =
      displayItem.displayName ??
      gameModelManager.getModel().settings.characterConfigs[
        displayItem.character
      ].defaultName;
    const color = useColor
      ? gameModelManager.getModel().settings.characterConfigs[
          displayItem.character
        ].textColor
      : undefined;
    await setDisplayType(`char:${name}`, renderEmptyLine);

    for (const index in displayItem.text) {
      let text: FormattedText = [];
      if (Number(index) === 0) {
        text.push({ type: "text", text: `${name}: "` });
      } else {
        text.push({ type: "text", text: "  " });
      }

      text.push(...displayItem.text[index]);

      if (Number(index) === displayItem.text.length - 1) {
        text.push({ type: "text", text: '"' });
      }
      const c = getColor(color);

      await renderText(
        text,
        displayItem.cpm,
        {
          color: c,
          indent: 2,
          prefix,
          postfix,
        },
        options
      );
    }

    resetStyling();
  } else if (displayItem.type === "error") {
    stateManager.setPlayState("reloading");
    gameModelManager.backupModel();

    for (const sentence of displayItem.message) {
      await renderText(sentence, Infinity, {});
    }
    return;
  }
};
