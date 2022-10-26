import { FormattedText } from "@point-n-click/engine";
import { hexColor } from "..";
import { getSettings } from "./settings";
import { wait, resetStyling, setStyling, TextStyling } from "./utils";

const minute = 60e3;

export const renderText = async (
  text: FormattedText,
  cpm: number,
  styling: TextStyling,
  addNewline = true
) => {
  if (getSettings().color) {
    setStyling(styling);
  }
  for (const element of text) {
    if (element.type === "text") {
      if (cpm === Infinity || cpm === 0) {
        process.stdout.write(element.text);
      } else {
        const delay = minute / cpm;
        const chars = element.text.split("");

        for (const char of chars) {
          process.stdout.write(char);
          await wait(delay);
        }
      }
    }
    if (element.type === "formatting") {
      const newStyling = {
        ...styling,
      };
      if (element.format === "b") {
        newStyling.bold = true;
      }
      if (element.format === "u") {
        newStyling.underline = true;
      }
      if (element.format === "i") {
        newStyling.italic = true;
      }
      if (element.format === "s") {
        newStyling.strikeThrough = true;
      }
      if (element.format === "color" && element.value) {
        newStyling.color = hexColor(element.value);
      }
      await renderText(element.contents, cpm, newStyling, false);
      if (getSettings().color) {
        resetStyling();
        setStyling(styling);
      }
    }
  }
  if (addNewline) {
    process.stdout.write("\n");
  }
};
