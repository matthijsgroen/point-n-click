import { DisplayInfo } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import React from "react";
import { formatText } from "./formatText";

export const TerminalText: React.FC<{ item: DisplayInfo<GameWorld> }> = ({
  item,
}) => {
  if (item.type === "narratorText") {
    return (
      <p>
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
      <p>
        {item.text.map((textLine, index, list) => (
          <React.Fragment key={index}>
            {index === 0 ? `${item.displayName}: "` : "&nbsp;&nbsp;"}
            {formatText(textLine)}
            {index === list.length - 1 ? '"' : ""}
          </React.Fragment>
        ))}
      </p>
    );
  }
  return <p>{JSON.stringify(item)}</p>;
};
