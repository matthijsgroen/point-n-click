import React, { useEffect, useRef, useState } from "react";
import { ThemeRenderer } from "@point-n-click/themes";
import styles from "./book.module.css";
import { TerminalText } from "./ui/TerminalText";
import { TerminalButton } from "./ui/TerminalButton";
import { Settings } from "./types";
import { bookSettings } from "./settings";
import { DialogButton } from "./ui/DialogButton";
import { classNames } from "./classnames";
import { useTypedContents } from "./hooks/useTypedContents";
import { SettingsDialog } from "./components/SettingsDialog";
import { Dialog } from "./components/Dialog";
import { ButtonGroup } from "./components/ButtonGroup";

enum DialogType {
  None,
  Pause,
  Settings,
}

const BookTheme: ThemeRenderer<Settings> = ({
  contents,
  translations,
  interactions,
  gameModelManager,
  themeSettings,
  skipToStep,
  onInteraction,
}) => {
  const { contents: typedContents, complete } = useTypedContents(
    contents,
    skipToStep
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isTurning, setIsTurning] = useState({
    turn: false,
    interaction: "",
    clear: false,
  });

  useEffect(() => {
    bookSettings.update({ skipScreen: false });
  }, [contents]);

  useEffect(() => {
    if (isTurning.turn) {
      const timer = setTimeout(() => {
        setIsTurning({
          turn: false,
          interaction: isTurning.interaction,
          clear: true,
        });
      }, 1110);
      return () => {
        clearTimeout(timer);
      };
    }
    if (isTurning.clear) {
      onInteraction(isTurning.interaction);
    }
  }, [isTurning]);
  useEffect(() => {
    if (isTurning.clear) {
      setIsTurning({ turn: false, interaction: "", clear: false });
    }
  }, [contents]);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        bookSettings.update({ skipScreen: true });
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

  let actionKey = 0;

  return (
    <div className={styles.display}>
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
      <div className={styles.book}>
        <div className={styles.pageStack}></div>
        <div className={styles.pageLocator}>
          <div
            key="stablePage"
            className={classNames({
              [styles.page]: true,
            })}
            style={{ zIndex: 0 }}
          ></div>
          <div
            key="shadowPage"
            className={classNames({
              [styles.pageShadow]: true,
              [styles.turn]: isTurning.turn,
            })}
          ></div>
          <div
            key="cover"
            className={classNames({
              [styles.cover]: true,
              [styles.open]: isOpen,
            })}
          >
            <p>Author</p>
            <h1>Title</h1>

            <button
              onClick={() => {
                setIsOpen(true);
              }}
            >
              Start
            </button>
          </div>
          <div className={styles.innerPage}></div>
          <div
            key="turnPage"
            className={classNames({
              [styles.page]: true,
              [styles.turn]: isTurning.turn,
            })}
          >
            {!isTurning.clear &&
              typedContents.map((item, index, list) => (
                <TerminalText
                  key={index}
                  item={item}
                  gameModelManager={gameModelManager}
                  settings={themeSettings}
                  displayCursor={index === list.length - 1 && !complete}
                />
              ))}
            {complete &&
              !isTurning.clear &&
              interactions.actions.length > 0 && (
                <div id="interactions">
                  <p>{interactions.prompt}</p>
                  {interactions.actions.map((item, index) => (
                    <p key={index} style={{ margin: 0 }}>
                      <TerminalButton
                        onClick={() => {
                          setIsTurning({
                            turn: true,
                            interaction: item.id,
                            clear: false,
                          });
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
          <div className={styles.pageBackside}></div>
        </div>
      </div>
      <Dialog ref={pauseDialogRef}>
        <form method="dialog">
          <h1>{translations["pause"] as string}</h1>
          <ButtonGroup>
            <DialogButton>{translations["saveGame"] as string}</DialogButton>
            <DialogButton>{translations["loadGame"] as string}</DialogButton>
            <DialogButton
              value="close"
              onClick={() => {
                setSettingsMenu(DialogType.Settings);
              }}
            >
              {translations["settings"] as string}
            </DialogButton>
            <DialogButton>Main menu</DialogButton>
          </ButtonGroup>
          <ButtonGroup>
            <DialogButton
              value="close"
              onClick={() => {
                setSettingsMenu(DialogType.None);
              }}
            >
              {translations["continuePlaying"] as string}
            </DialogButton>
          </ButtonGroup>
        </form>
      </Dialog>
      <SettingsDialog
        ref={settingsDialogRef}
        translations={translations}
        onClose={() => {
          setSettingsMenu(DialogType.None);
        }}
      />
    </div>
  );
};

export default BookTheme;
