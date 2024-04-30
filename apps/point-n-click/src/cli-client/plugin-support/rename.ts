import {
  ContentPluginContent,
  FormattedText,
  GameWorld,
  hexColor,
} from "@point-n-click/types";
import { PluginProps } from "./types";
import { setDisplayType } from "../displayType";
import { getSettings } from "../settings";
import { getPaletteColor } from "@point-n-click/engine";
import { renderText } from "../renderText";
import { resetStyling, setColor } from "../utils";
import { produce } from "immer";

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

type PluginStatementProps = {
  character: string;
  currentName: string;
  prompt: FormattedText;
  storageKey: string;
};

export const isCharacterRename = (
  item: ContentPluginContent
): item is ContentPluginContent & PluginStatementProps =>
  item.pluginSource === "characterRename" && item.type === "CharacterRename";

export const handleRename = async <Game extends GameWorld>(
  displayItem: PluginStatementProps,
  {
    state,
    gameModelManager,
    prefix,
    postfix,
    renderEmptyLine,
    supplyPatch,
    lightMode,
    storeCustomInput,
  }: PluginProps<Game>
) => {
  await setDisplayType("prompt", renderEmptyLine);

  const useColor = getSettings().color;
  const textColor = useColor
    ? gameModelManager.getModel().settings.colors.defaultTextColor
    : undefined;

  const getColor = getPaletteColor(
    gameModelManager,
    lightMode ? "light" : "dark"
  );
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
  const { newName } = await storeCustomInput<{ newName: string }>(
    async () => {
      const input = await prompt();
      return { newName: input };
    },
    async ({ newName }) => {
      console.log(newName);
    }
  );
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
};
