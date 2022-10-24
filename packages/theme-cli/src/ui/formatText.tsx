import { FormattedText } from "@point-n-click/engine";

export const formatText = (text: FormattedText) =>
  text.map((node, index): React.ReactNode => {
    if (node.type === "text") {
      return node.text;
    } else {
      if (node.format === "b") {
        return <strong key={index}>{formatText(node.contents)}</strong>;
      }
      if (node.format === "i") {
        return <em key={index}>{formatText(node.contents)}</em>;
      }
      return formatText(node.contents);
    }
  });
