import { FormattedText } from "@point-n-click/engine";
import { hexColor } from "..";
import { getSettings } from "./settings";
import { wait, resetStyling, setStyling, TextStyling } from "./utils";

const minute = 60e3;

export const splitLines = (
  text: FormattedText,
  indent: number,
  maxWidth: number
): FormattedText => {
  let current = 0;

  const handleText = (t: FormattedText) => {
    for (let i = 0; i < t.length; i++) {
      const element = t[i];
      if (element.type === "text") {
        const chars = element.text;
        if (chars.length + current > maxWidth) {
          let sentence = "";
          let word = "";
          for (const char of chars.split("")) {
            if (char === " ") {
              word += char;

              if (current + word.length > maxWidth) {
                sentence += `\n${Array(indent).fill(" ").join("")}`;
                current = indent;
              }

              sentence += word;
              current += word.length;
              word = "";
            } else {
              word += char;
            }
          }
          if (current + word.length > maxWidth) {
            sentence += `\n${Array(indent).fill(" ").join("")}`;
            current = indent;
          }
          sentence += word;
          current += word.length;

          element.text = sentence;
        } else {
          current += chars.length;
        }
      }
      if (element.type === "formatting") {
        handleText(element.contents);
      }
    }
  };

  handleText(text);

  return text;
};

export const renderText = async (
  text: FormattedText,
  cpm: number,
  styling: TextStyling,
  addNewline = true
) => {
  const width = process.stdout.columns ?? Infinity;
  const line = splitLines(text, styling.indent ?? 0, width);
  // const line = text;
  await renderLine(line, cpm, styling);

  if (addNewline) {
    process.stdout.write("\n");
  }
};

export const renderLine = async (
  text: FormattedText,
  cpm: number,
  styling: TextStyling
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
};
