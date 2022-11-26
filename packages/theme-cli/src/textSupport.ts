import {
  DisplayInfo,
  FormattedText,
  isContentPluginContent,
} from "@point-n-click/engine";
import { ContentPluginContent, GameWorld } from "@point-n-click/types";
import { isDescriptionText } from "./isDescriptionText";

const countDisplayInfoCharacters = (
  element: DisplayInfo<GameWorld>
): number => {
  if (isContentPluginContent(element)) {
    if (isDescriptionText(element)) {
      return element.text.reduce(
        (textResult, element) => textResult + formattedTextLength(element),
        0
      );
    }
    return 0;
  }
  if (element.type === "narratorText") {
    return element.text.reduce(
      (textResult, element) => textResult + formattedTextLength(element),
      0
    );
  }
  if (element.type === "characterText") {
    return element.text.reduce(
      (textResult, element) => textResult + formattedTextLength(element),
      (element.displayName ?? "").length + 2 // quotes
    );
  }
  return 0;
};

export const countCharacters = (contents: DisplayInfo<GameWorld>[]): number =>
  contents.reduce(
    (result, element): number => result + countDisplayInfoCharacters(element),
    0
  );

const formattedTextLength = (text: FormattedText): number =>
  text.reduce((result, element) => {
    if (element.type === "text") {
      return result + element.text.length;
    }
    if (element.type === "formatting") {
      return result + formattedTextLength(element.contents);
    }
    return result;
  }, 0);

const sliceFormattedTexts = (
  texts: FormattedText[],
  characters: number
): FormattedText[] => {
  let charsLeft = characters;
  const result: FormattedText[] = [];

  for (const text of texts) {
    const length = formattedTextLength(text);
    if (length < charsLeft) {
      charsLeft -= length;
      result.push(text);
    } else if (charsLeft > 0) {
      const sliced = sliceFormattedText(text, charsLeft);
      result.push(sliced);
      return result;
    }
  }

  return result;
};

const sliceFormattedText = (
  text: FormattedText,
  characters: number
): FormattedText => {
  let charsLeft = characters;

  return text.reduce<FormattedText>((result, element) => {
    if (element.type === "text") {
      const length = element.text.length;
      if (length < charsLeft) {
        charsLeft -= length;
        return result.concat(element);
      } else if (charsLeft > 0) {
        const toSlice = charsLeft;
        charsLeft = 0;
        return result.concat({
          ...element,
          text: element.text.slice(0, toSlice),
        });
      }
    }
    if (element.type === "formatting") {
      const length = formattedTextLength(element.contents);
      if (length < charsLeft) {
        charsLeft -= length;
        return result.concat(element);
      } else if (charsLeft > 0) {
        const toSlice = charsLeft;
        charsLeft = 0;
        return result.concat({
          ...element,
          contents: sliceFormattedText(element.contents, toSlice),
        });
      }
    }
    return result;
  }, []);
};

const sliceDisplayInfo = (
  content: DisplayInfo<GameWorld>,
  characters: number
): DisplayInfo<GameWorld> => {
  if (isContentPluginContent(content)) {
    if (isDescriptionText(content)) {
      return {
        ...content,
        text: sliceFormattedTexts(content.text, characters),
      } as ContentPluginContent;
    }
    return content;
  }
  if (content.type === "narratorText") {
    return {
      ...content,
      text: sliceFormattedTexts(content.text, characters),
    };
  }
  if (content.type === "characterText") {
    return {
      ...content,
      text: sliceFormattedTexts(content.text, characters),
    };
  }

  return content;
};

export const sliceCharacters = (
  contents: DisplayInfo<GameWorld>[],
  characters: number
): DisplayInfo<GameWorld>[] => {
  let charsLeft = characters;
  const resultContent: DisplayInfo<GameWorld>[] = [];
  for (const info of contents) {
    const infoLength = countDisplayInfoCharacters(info);
    if (infoLength < charsLeft) {
      charsLeft -= infoLength;
      resultContent.push(info);
    } else if (charsLeft > 0) {
      const slicedInfo = sliceDisplayInfo(info, charsLeft);
      resultContent.push(slicedInfo);
      return resultContent;
    }
  }

  return resultContent;
};
