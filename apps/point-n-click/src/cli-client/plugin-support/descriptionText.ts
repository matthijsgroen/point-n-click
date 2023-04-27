import {
  ContentPluginContent,
  FormattedText,
  GameStateManager,
  GameWorld,
} from "@point-n-click/types";
import { renderText } from "../renderText";
import { isListItem, resetStyling } from "../utils";
import { getPaletteColor } from "@point-n-click/engine";
import { getSettings } from "../settings";
import { PluginProps } from "./types";
import { setDisplayType } from "../displayType";

type PluginStatementProps = {
  text: FormattedText[];
};

export const isDescriptionText = (
  item: ContentPluginContent
): item is ContentPluginContent & PluginStatementProps =>
  item.pluginSource === "descriptionText" && item.type === "descriptionText";

export const handleDescriptionText = async <Game extends GameWorld>(
  displayItem: PluginStatementProps,
  {
    gameModelManager,
    lightMode,
    state,
    prefix,
    postfix,
    renderEmptyLine,
  }: PluginProps<Game>
) => {
  await setDisplayType("text", renderEmptyLine);

  const useColor = getSettings().color;
  const textColor = useColor
    ? gameModelManager.getModel().settings.colors.defaultTextColor
    : undefined;

  const getColor = getPaletteColor(
    gameModelManager,
    lightMode ? "light" : "dark"
  );

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
};
