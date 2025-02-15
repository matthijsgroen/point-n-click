import { DisplayInfo, isContentPluginContent } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import { useEffect, useRef, useState } from "react";
import { terminalSettings } from "../settings";
import { countCharacters, sliceCharacters } from "../textSupport";

const MINUTE = 60000;

export const useTypedContents = (
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
  let cpm =
    lastLine && isContentPluginContent(lastLine)
      ? 2000
      : lastLine && lastLine.type !== "error"
      ? lastLine.cpm
      : 2000;
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
