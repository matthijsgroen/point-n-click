import {
  ContentPluginContent,
  FormattedText,
  GameWorld,
} from "@point-n-click/types";
import { PluginProps } from "./types";
import { getTextLength, renderText } from "../renderText";
import { setDisplayType } from "../displayType";

type PluginStatementProps = {
  decoration: "Note" | "Page";
  decorationPosition: "start" | "end";
};

export const isNoteLetters = (
  item: ContentPluginContent
): item is ContentPluginContent & PluginStatementProps =>
  item.pluginSource === "notesAndLetters" && item.type === "TextBox";

export const handleNotesLetters = async <Game extends GameWorld>(
  displayItem: PluginStatementProps,
  { updateBorder, prefix, postfix, renderEmptyLine }: PluginProps<Game>
) => {
  const noteBorder = (text: string): FormattedText => [
    {
      type: "formatting",
      format: "color",
      value: "996644",
      contents: [{ type: "text", text }],
    },
  ];

  const pageBorder = (text: string): FormattedText => [
    {
      type: "formatting",
      format: "color",
      value: "bf7340",
      contents: [{ type: "text", text }],
    },
  ];

  if (
    displayItem.decoration === "Note" &&
    displayItem.decorationPosition === "start"
  ) {
    const width =
      process.stdout.columns - getTextLength(prefix) - getTextLength(postfix);

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

  if (
    displayItem.decoration === "Page" &&
    displayItem.decorationPosition === "start"
  ) {
    const width =
      process.stdout.columns - getTextLength(prefix) - getTextLength(postfix);

    await renderEmptyLine();
    await renderText(
      pageBorder(
        ` \u250C${Array(width - 4)
          .fill("\u2500")
          .join("")}\u2556 `
      ),
      0,
      {
        prefix,
        postfix,
      }
    );
    updateBorder(
      [...prefix, ...pageBorder(" \u2502  ")],
      [...pageBorder("  \u2551 "), ...postfix]
    );
  }

  if (
    displayItem.decoration === "Page" &&
    displayItem.decorationPosition === "end"
  ) {
    const newPrefix = prefix.slice(0, -1);
    const newPostfix = postfix.slice(1);

    const width =
      process.stdout.columns -
      getTextLength(newPrefix) -
      getTextLength(newPostfix);

    await renderText(
      pageBorder(
        ` \u2514${Array(width - 4)
          .fill("\u2500")
          .join("")}\u255C `
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
};
