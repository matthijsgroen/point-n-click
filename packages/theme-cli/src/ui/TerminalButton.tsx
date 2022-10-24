import { InteractionAction } from "@point-n-click/engine";
import React, { useEffect } from "react";
import { formatText } from "./formatText";
import styles from "./TerminalButton.module.css";

export const TerminalButton: React.FC<{
  onClick?: () => void;
  item: InteractionAction;
  shortcut: string;
}> = ({ onClick, item, shortcut }) => {
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.code === `Key${shortcut}` || e.code === `Digit${shortcut}`) {
        onClick && onClick();
        e.preventDefault();
      }
    };

    document.body.addEventListener("keydown", keyListener);
    return () => {
      document.body.removeEventListener("keydown", keyListener);
    };
  });

  return (
    <button className={styles.button} onClick={onClick}>
      {shortcut}) {formatText(item.label)}
    </button>
  );
};
