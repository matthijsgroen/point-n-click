import { FormattedText } from "@point-n-click/engine";
import { hexColor } from "..";
import { getSettings } from "./settings";
import { wait, resetStyling, setStyling, TextStyling } from "./utils";

const minute = 60e3;

const getTextLength = (text: FormattedText): number =>
  text.reduce(
    (r, e) =>
      e.type === "text" ? r + e.text.length : r + getTextLength(e.contents),
    0
  );

export const splitLines = (
  text: FormattedText,
  styling: TextStyling,
  maxWidth: number
): FormattedText => {
  const prefix = styling.prefix ?? [];
  const postfix = styling.postfix ?? [];
  const prefLength = getTextLength(prefix);
  const postLength = getTextLength(postfix);
  let current = prefLength;
  const indent = styling.indent ?? 0;

  const formattedText = [...prefix, ...text];

  const handleText = (t: FormattedText) => {
    const result: FormattedText = [];
    for (let i = 0; i < t.length; i++) {
      const element = t[i];
      if (element.type === "text") {
        const chars = element.text;
        if (chars.length + current + postLength > maxWidth) {
          let sentence = "";
          let word = "";
          for (const char of chars.split("")) {
            if (char === " ") {
              word += char;

              if (current + word.length > maxWidth) {
                result.push({ type: "text", text: sentence });
                if (styling.postfix) {
                  const spacing = maxWidth - current;
                  result.push({
                    type: "text",
                    text: Array(spacing).fill(" ").join(""),
                  });
                  result.push(...postfix);
                }
                result.push({ type: "text", text: "\n" });
                result.push(...prefix);

                sentence = `${Array(indent).fill(" ").join("")}`;
                current = indent + prefLength + postLength;
              }

              sentence += word;
              current += word.length;
              word = "";
            } else {
              word += char;
            }
          }
          if (current + word.length > maxWidth) {
            result.push({ type: "text", text: sentence });
            if (styling.postfix) {
              const spacing = maxWidth - current;
              result.push({
                type: "text",
                text: Array(spacing).fill(" ").join(""),
              });
              result.push(...postfix);
            }
            result.push({ type: "text", text: "\n" });
            result.push(...prefix);

            sentence = `${Array(indent).fill(" ").join("")}`;
            current = indent + prefLength + postLength;
          }
          sentence += word;
          current += word.length;

          result.push({ type: "text", text: sentence });
        } else {
          current += chars.length;
          result.push({ type: "text", text: element.text });
        }
      }
      if (element.type === "formatting") {
        const formattedText = handleText(element.contents);
        result.push({ ...element, contents: formattedText });
      }
    }
    return result;
  };

  const res = handleText(formattedText);
  if (styling.postfix) {
    const spacing = maxWidth - current;
    res.push({
      type: "text",
      text: Array(spacing).fill(" ").join(""),
    });
    res.push(...postfix);
  }
  return res;
};

export const renderText = async (
  text: FormattedText,
  cpm: number,
  styling: TextStyling,
  addNewline = true
) => {
  const width = process.stdout.columns ?? Infinity;
  const line = splitLines(text, styling, width);
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
      await renderLine(element.contents, cpm, newStyling);
      if (getSettings().color) {
        resetStyling();
        setStyling(styling);
      }
    }
  }
};
