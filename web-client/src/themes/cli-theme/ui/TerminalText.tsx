import { DisplayInfo, GameModelManager } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import React from "react";
import { Settings } from "../types";
import { formatText } from "./formatText";

export const TerminalText: React.FC<{
  item: DisplayInfo<GameWorld>;
  gameModelManager: GameModelManager<GameWorld>;
  settings: Settings;
}> = ({ item, gameModelManager, settings }) => {
  if (item.type === "narratorText") {
    return (
      <p
        style={
          settings.color
            ? {
                color: `#${
                  gameModelManager.getModel().settings.defaultTextColor
                }`,
              }
            : {}
        }
      >
        {item.text.map((formattedText, key) => (
          <React.Fragment key={key}>
            {formatText(formattedText)}
            <br />
          </React.Fragment>
        ))}
      </p>
    );
  }
  if (item.type === "characterText") {
    return (
      <p
        style={
          settings.color
            ? {
                color: `#${
                  gameModelManager.getModel().settings.characterConfigs[
                    item.character
                  ].textColor
                }`,
              }
            : {}
        }
      >
        {item.text.map((textLine, index, list) => (
          <React.Fragment key={index}>
            {index === 0 ? (
              `${item.displayName}: "`
            ) : (
              <span style={{ paddingLeft: "2ch" }}></span>
            )}
            {formatText(textLine)}
            {index === list.length - 1 ? '"' : ""}
            <br />
          </React.Fragment>
        ))}
      </p>
    );
  }
  return <p>{JSON.stringify(item)}</p>;
};
