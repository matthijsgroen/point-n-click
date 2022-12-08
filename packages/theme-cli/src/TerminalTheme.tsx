import React, { useEffect, useRef, useState } from "react";
import { ThemeRenderer } from "@point-n-click/themes";
import { GameWorld } from "@point-n-click/types";
import { DisplayInfo, isContentPluginContent } from "@point-n-click/engine";
import "./screen.css";
import styles from "./display.module.css";
import { TerminalText } from "./ui/TerminalText";
import { TerminalButton } from "./ui/TerminalButton";
import { Settings } from "./types";
import { terminalSettings } from "./settings";
import { countCharacters, sliceCharacters } from "./textSupport";
import { DialogButton } from "./ui/DialogButton";
import { DialogSelect, SelectOption } from "./ui/DialogSelect";

const MINUTE = 60000;

enum DialogType {
  None,
  Pause,
  Settings,
}

const classNames = (struct: { [x: string]: boolean }): string =>
  Object.entries(struct)
    .filter(([, k]) => k)
    .map(([v]) => v)
    .join(" ");

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

const usePreformattedCharacters = (
  contents: DisplayInfo<GameWorld>[]
): DisplayInfo<GameWorld>[] => {
  return contents;
};

const TerminalTheme: ThemeRenderer<Settings> = ({
  contents,
  translations,
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

  const [settingsMenu, setSettingsMenu] = useState(DialogType.None);

  const pauseDialogRef = useRef<HTMLDialogElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (settingsMenu === DialogType.Pause) {
      pauseDialogRef.current?.showModal();
    }
    if (settingsMenu === DialogType.Settings) {
      settingsDialogRef.current?.showModal();
    }
  }, [settingsMenu]);

  const languageOptions: SelectOption<string>[] = Object.entries(
    gameModelManager.getModel().settings.locales.supported
  ).map<SelectOption<string>>(([key, value]) => ({ label: value, value: key }));

  let actionKey = 0;

  return (
    <div
      className={classNames({
        [styles.screen]: true,
        [styles.colorScreen]: settings.color,
      })}
    >
      <div className={styles.stickyBar}>
        <button
          className={styles.menuButton}
          onClick={() => {
            setSettingsMenu(DialogType.Pause);
          }}
        >
          {translations["menu"] as string}
        </button>
      </div>
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
      <dialog ref={pauseDialogRef} className={styles.dialog}>
        <form method="dialog">
          <h1>Game paused</h1>
          <div className={styles.buttonGroup}>
            <DialogButton>Save game</DialogButton>
            <DialogButton>Load game</DialogButton>
            <DialogButton
              value="close"
              onClick={() => {
                setSettingsMenu(DialogType.Settings);
              }}
            >
              Settings
            </DialogButton>
            <DialogButton>Main menu</DialogButton>
          </div>
          <button
            className={`${styles.dialogButton} ${styles.dialogCloseButton}`}
            value="close"
            onClick={() => {
              setSettingsMenu(DialogType.None);
            }}
          >
            Continue playing
          </button>
        </form>
      </dialog>
      <dialog ref={settingsDialogRef} className={styles.dialog}>
        <form method="dialog">
          <h1>Settings</h1>
          <div className={styles.buttonGroup}>
            <DialogButton>Theme</DialogButton>
            <DialogSelect label="Language" options={languageOptions} />
            <DialogButton>Text speed</DialogButton>
          </div>
          <button
            className={`${styles.dialogButton} ${styles.dialogCloseButton}`}
            value="close"
            onClick={() => {
              setSettingsMenu(DialogType.None);
            }}
          >
            Close
          </button>
        </form>
      </dialog>
    </div>
  );
};

export default TerminalTheme;
