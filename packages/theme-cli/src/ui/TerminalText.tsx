import {
  DisplayInfo,
  GameModelManager,
  isContentPluginContent,
} from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import React from "react";
import { isDescriptionText } from "../isDescriptionText";
import { Settings } from "../types";
import { formatText } from "./formatText";
import styles from "./TerminalText.module.css";

export const TerminalText: React.FC<{
  item: DisplayInfo<GameWorld>;
  gameModelManager: GameModelManager<GameWorld>;
  settings: Settings;
  displayCursor?: boolean;
}> = ({ item, gameModelManager, settings, displayCursor = false }) => {
  if (isContentPluginContent(item)) {
    if (isDescriptionText(item)) {
      return (
        <p
          className={`${styles.lines} ${displayCursor ? styles.cursor : ""}`}
          style={
            settings.color
              ? ({
                  "--color": `#${
                    gameModelManager.getModel().settings.defaultTextColor
                  }`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {item.text.map((formattedText, key) => (
            <span className={styles.line} key={key}>
              {formatText(formattedText)}
            </span>
          ))}
        </p>
      );
    }
    return null;
  }
  if (item.type === "narratorText") {
    return (
      <p
        className={`${styles.lines} ${displayCursor ? styles.cursor : ""}`}
        style={
          settings.color
            ? ({
                "--color": `#${
                  gameModelManager.getModel().settings.defaultTextColor
                }`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {item.text.map((formattedText, key) => (
          <span className={styles.line} key={key}>
            {formatText(formattedText)}
          </span>
        ))}
      </p>
    );
  }
  if (item.type === "characterText") {
    return (
      <p
        className={`${styles.lines} ${displayCursor ? styles.cursor : ""}`}
        style={
          settings.color
            ? ({
                "--color": `#${
                  gameModelManager.getModel().settings.characterConfigs[
                    item.character
                  ].textColor
                }`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {item.text.map((textLine, index, list) => (
          <span className={styles.line} key={index}>
            {index === 0 ? (
              `${item.displayName}: "`
            ) : (
              <span style={{ paddingLeft: "2ch" }}></span>
            )}
            {formatText(textLine)}
            {index === list.length - 1 ? '"' : ""}
          </span>
        ))}
      </p>
    );
  }
  return <p>{JSON.stringify(item)}</p>;
};
