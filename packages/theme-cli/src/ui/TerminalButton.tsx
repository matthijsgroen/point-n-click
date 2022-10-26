import { InteractionAction } from "@point-n-click/engine";
import { formatText } from "@point-n-click/themes";
import React, { useEffect } from "react";
import { classNames } from "../classnames";
import styles from "./TerminalButton.module.css";

export const TerminalButton: React.FC<{
  onClick?: () => void;
  item: InteractionAction;
  shortcut: string;
  global: boolean;
}> = ({ onClick, item, shortcut, global }) => {
  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (
        e.code === `Key${shortcut.toUpperCase()}` ||
        e.code === `Digit${shortcut}`
      ) {
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
    <button
      className={classNames({
        [styles.button]: true,
        [styles.global]: global,
      })}
      onClick={onClick}
    >
      {shortcut.toUpperCase()}) {formatText(item.label)}
    </button>
  );
};
