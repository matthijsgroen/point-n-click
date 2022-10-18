import { GameWorld } from "@point-n-click/types";
import { GameModelManager } from "../engine/model/gameModel";
import { DisplayInfo } from "../engine/runScript";
import { FormattedText } from "../engine/text/types";
import { renderText } from "./renderText";
import { getSettings } from "./settings";
import { resetStyling } from "./utils";

export const renderScreen = async <Game extends GameWorld>(
  info: DisplayInfo<Game>[],
  gameModelManager: GameModelManager<Game>
): Promise<void> => {
  const useColor = getSettings().color;
  const textColor = useColor
    ? gameModelManager.getModel().settings.defaultTextColor
    : undefined;

  for (const displayItem of info) {
    if (displayItem.type === "narrator") {
      for (const sentence of displayItem.text) {
        await renderText(sentence, displayItem.cpm, { color: textColor });
      }
      console.log("");
      resetStyling();
    } else if (displayItem.type === "character") {
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
        await renderText(text, displayItem.cpm, { color });
      }
      console.log("");
      resetStyling();
    } else {
      console.log(displayItem);
    }
  }
};
