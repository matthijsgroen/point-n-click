import {
  DisplayInfo,
  FormattedText,
  GameModelManager,
  getPaletteColor,
  isContentPluginContent,
} from "@point-n-click/engine";
import {
  ContentPluginContent,
  GameWorld,
  GameState,
  GameSaveStateManager,
  PatchFunction,
  hexColor,
} from "@point-n-click/types";
import { getTextLength, renderText } from "./renderText";
import { getSettings } from "./settings";
import { resetStyling, setColor } from "./utils";
import { produce } from "immer";
import { saveProgress } from "./saveProgress";
import { setDisplayType } from "./displayType";

const stdin = process.stdin;

const prompt = () =>
  new Promise<string>((resolve) => {
    stdin.setRawMode(false);
    stdin.setEncoding("utf8");
    const callback = (chunk: string) => {
      resolve(chunk.slice(0, -1));

      stdin.setRawMode(true);
      stdin.setEncoding("utf8");
      stdin.removeListener("data", callback);
    };

    stdin.on("data", callback);
  });

const isDescriptionText = (
  item: ContentPluginContent
): item is ContentPluginContent & { text: FormattedText[] } =>
  item.pluginSource === "descriptionText" && item.type === "descriptionText";

const isTextBox = (
  item: ContentPluginContent
): item is ContentPluginContent & {
  decoration: "Note";
  decorationPosition: "start" | "end";
} => item.pluginSource === "notesAndLetters" && item.type === "TextBox";

const isCharacterRename = (
  item: ContentPluginContent
): item is ContentPluginContent & {
  character: string;
  currentName: string;
  prompt: FormattedText;
  storageKey: string;
} => item.pluginSource === "characterRename" && item.type === "CharacterRename";

const isListItem = (text: FormattedText): boolean =>
  text[0] && text[0].type === "text" && text[0].text.startsWith("- ");

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

  const state = stateManager.activeState();
  const renderEmptyLine = ({ pre, post } = { pre: prefix, post: postfix }) =>
    renderText([{ type: "text", text: "" }], 0, {
      prefix: pre,
      postfix: post,
    });

  if (isContentPluginContent(displayItem)) {
    if (isDescriptionText(displayItem)) {
      await setDisplayType("text", renderEmptyLine);
      for (const sentence of displayItem.text) {
        const cpm = state.get().settings.cpm;
        const color = getColor(textColor);
        await renderText(sentence, cpm, {
          color,
          prefix,
          postfix,
          indent: isListItem(sentence) ? 2 : 0,
        });
      }
      resetStyling();
    }

    if (isTextBox(displayItem)) {
      const noteBorder = (text: string): FormattedText => [
        {
          type: "formatting",
          format: "color",
          value: "996644",
          contents: [{ type: "text", text }],
        },
      ];

      if (
        displayItem.decoration === "Note" &&
        displayItem.decorationPosition === "start"
      ) {
        const width =
          process.stdout.columns -
          getTextLength(prefix) -
          getTextLength(postfix);

        await renderEmptyLine();
        await renderText(
          noteBorder(
            `  \u256D${Array(width - 6)
              .fill("\u2500")
              .join("")}\u256E  `
          ),
          0,
          {
            prefix,
            postfix,
          }
        );
        updateBorder(
          [...prefix, ...noteBorder("  \u2502 ")],
          [...noteBorder(" \u2502  "), ...postfix]
        );
      }

      if (
        displayItem.decoration === "Note" &&
        displayItem.decorationPosition === "end"
      ) {
        const newPrefix = prefix.slice(0, -1);
        const newPostfix = postfix.slice(1);

        const width =
          process.stdout.columns -
          getTextLength(newPrefix) -
          getTextLength(newPostfix);

        await renderText(
          noteBorder(
            `  \u2570${Array(width - 6)
              .fill("\u2500")
              .join("")}\u256F  `
          ),
          0,
          {
            prefix: newPrefix,
            postfix: newPostfix,
          }
        );
        updateBorder(newPrefix, newPostfix);
        setDisplayType("note", () => {});
      }
    }

    if (isCharacterRename(displayItem)) {
      await setDisplayType("prompt", renderEmptyLine);
      const color = getColor(textColor);
      const cpm = state.get().settings.cpm;
      // 1. Show input prompt
      await renderText(displayItem.prompt, cpm, {
        color,
        prefix,
        postfix,
      });
      // 2. Gather result
      setColor(
        getColor(
          gameModelManager.getModel().settings.characterConfigs[
            displayItem.character
          ].textColor
        ) ?? hexColor("888888")
      );
      let newName: string | boolean = "";
      const suppliedValue = stateManager.activeState().get().inputs[key];
      if (suppliedValue) {
        newName = (suppliedValue as { newName: string }).newName;
        console.log(newName);
      } else {
        newName = await Promise.race([
          prompt(),
          gameModelManager.waitForChange(),
        ]);
        if (typeof newName === "boolean") {
          stateManager.setPlayState("reloading");
          return;
        }
        stateManager.storeInput(key, { newName });
        await saveProgress(stateManager);
      }
      resetStyling();
      supplyPatch(
        produce((state) => {
          (state.characters as Record<string, { name: string }>)[
            displayItem.character
          ].name = String(newName);
        })
      );

      // 3. Set state
      resetStyling();
    }
    return;
  }
  if (displayItem.type === "narratorText") {
    await setDisplayType("text", renderEmptyLine);
    for (const sentence of displayItem.text) {
      const color = getColor(textColor);
      await renderText(sentence, displayItem.cpm, {
        color,
        prefix,
        postfix,
        indent: isListItem(sentence) ? 2 : 0,
      });
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

      await renderText(text, displayItem.cpm, {
        color: c,
        indent: 2,
        prefix,
        postfix,
      });
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
