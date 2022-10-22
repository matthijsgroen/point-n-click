import { FormattedText } from "@point-n-click/engine";

export const formatText = (text: FormattedText) =>
  text
    .map((node): string => {
      if (node.type === "text") {
        return node.text;
      } else {
        return formatText(node.contents);
      }
    })
    .join("");
