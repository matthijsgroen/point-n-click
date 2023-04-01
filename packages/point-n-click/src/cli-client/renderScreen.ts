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
  GameStateManager,
} from "@point-n-click/types";
import { renderText } from "./renderText";
import { getSettings } from "./settings";
import { resetStyling } from "./utils";

const isDescriptionText = (
  item: ContentPluginContent
): item is ContentPluginContent & { text: FormattedText[] } =>
  item.pluginSource === "descriptionText" && item.type === "descriptionText";

export const renderScreen = async <Game extends GameWorld>(
  info: DisplayInfo<Game>[],
  gameModelManager: GameModelManager<Game>,
  stateManager: GameStateManager<Game>
): Promise<void> => {
  const useColor = getSettings().color;
  const textColor = useColor
    ? gameModelManager.getModel().settings.colors.defaultTextColor
    : undefined;

  const getColor = getPaletteColor(gameModelManager, "dark");
  let viewKey: string = "";

  const setKey = (key: string) => {
    if (key === viewKey) return;
    if (viewKey !== key && viewKey !== "") {
      console.log("");
    }
    viewKey = key;
  };

  for (const displayItem of info) {
    if (isContentPluginContent(displayItem)) {
      if (isDescriptionText(displayItem)) {
        setKey("text");
        for (const sentence of displayItem.text) {
          const cpm = stateManager.getState().settings.cpm;
          const color = getColor(textColor);
          await renderText(sentence, cpm, { color });
        }
        resetStyling();
      }
      continue;
    }
    if (displayItem.type === "narratorText") {
      setKey("text");
      for (const sentence of displayItem.text) {
        const color = getColor(textColor);
        await renderText(sentence, displayItem.cpm, { color });
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
      setKey(`char:${name}`);

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
        await renderText(text, displayItem.cpm, { color: c });
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
  }
};
