import { Theme, ThemeRenderer } from "@point-n-click/themes";
import "./screen.css";
import styles from "./display.module.css";
import { TerminalText } from "./ui/TerminalText";
import { TerminalButton } from "./ui/TerminalButton";
import { Settings } from "./types";
import { DisplayInfo, FormattedText } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { terminalSettings } from "./settings";

const countDisplayInfoCharacters = (
  element: DisplayInfo<GameWorld>
): number => {
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

const countCharacters = (contents: DisplayInfo<GameWorld>[]): number =>
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

const sliceCharacters = (
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

const MINUTE = 60000;

const useTypedContents = (
  contents: DisplayInfo<GameWorld>[],
  skipToStep: number
): { contents: DisplayInfo<GameWorld>[]; complete: boolean } => {
  const count = countCharacters(contents);
  const [charactersShown, setCharactersShown] = useState(
    skipToStep === 0 ? 0 : count
  );
  const contentRef = useRef(contents);
  const shown =
    contentRef.current === contents
      ? charactersShown
      : skipToStep === 0
      ? 0
      : count;

  const sliced = sliceCharacters(contents, shown);
  const lastLine = sliced.at(-1);
  let cpm = lastLine && lastLine.type !== "error" ? lastLine.cpm : 2000;
  if (cpm === 0) {
    cpm = 2000;
  }

  const delay = terminalSettings.get().skipScreen ? 0 : MINUTE / cpm;

  useEffect(() => {
    if (contentRef.current !== contents) {
      setCharactersShown(skipToStep === 0 ? 0 : count);
      contentRef.current = contents;
    } else if (charactersShown < count) {
      const timeout = setTimeout(() => {
        setCharactersShown((counter) => counter + 1);
      }, delay);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [charactersShown, count, contents]);

  return { contents: sliced, complete: shown >= count };
};

const usePreformattedCharacters = (
  contents: DisplayInfo<GameWorld>[]
): DisplayInfo<GameWorld>[] => {
  return contents;
};

const TerminalTheme: ThemeRenderer<Settings> = ({
  contents,
  interactions,
  gameModelManager,
  settings,
  skipToStep,
  onInteraction,
}) => {
  const convertedContents = usePreformattedCharacters(contents);
  const { contents: typedContents, complete } = useTypedContents(
    convertedContents,
    skipToStep
  );

  useEffect(() => {
    terminalSettings.update({ skipScreen: false });
  }, [contents]);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        terminalSettings.update({ skipScreen: true });
        e.preventDefault();
      }

      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        const interactions = document.getElementById("interactions");
        if (interactions) {
          const interactionButtons = Array.from(
            interactions.querySelectorAll("button")
          );
          const element =
            interactions.querySelector<HTMLButtonElement>("button:focus");
          if (!element) {
            let elem: HTMLButtonElement | undefined;
            if (e.code === "ArrowDown" && (elem = interactionButtons[0])) {
              elem.focus();
              return;
            }
            if (e.code === "ArrowUp" && (elem = interactionButtons.at(-1))) {
              elem.focus();
              return;
            }
          } else {
            const index = interactionButtons.indexOf(element);
            const newIndex =
              (e.code === "ArrowDown"
                ? index + 1
                : index + interactionButtons.length - 1) %
              interactionButtons.length;
            interactionButtons[newIndex].focus();
          }
        }
      }
    };

    document.body.addEventListener("keydown", keyListener);
    return () => {
      document.body.removeEventListener("keydown", keyListener);
    };
  }, []);

  let actionKey = 0;

  return (
    <div className={styles.display} data-testid="terminal theme">
      {typedContents.map((item, index, list) => (
        <TerminalText
          key={index}
          item={item}
          gameModelManager={gameModelManager}
          settings={settings}
          displayCursor={index === list.length - 1 && !complete}
        />
      ))}
      {complete && interactions.actions.length > 0 && (
        <div id="interactions">
          <p>{interactions.prompt}</p>
          {interactions.actions.map((item, index) => (
            <p key={index} style={{ margin: 0 }}>
              <TerminalButton
                onClick={() => {
                  onInteraction(item.id);
                }}
                item={item}
                shortcut={item.shortcutKey || `${++actionKey}`}
                global={item.isGlobal}
              />
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const terminalTheme: Theme<Settings> = {
  name: "Terminal",
  author: "Matthijs Groen",
  version: "0.0.1",
  render: TerminalTheme,
  defaultSettings: { color: true },
};
