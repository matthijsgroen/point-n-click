import { InteractionAction } from "@point-n-click/engine";
import React from "react";
import { formatText } from "./formatText";
import styles from "./TerminalButton.module.css";

export const TerminalButton: React.FC<{
  onClick?: () => void;
  item: InteractionAction;
  shortcut: string;
}> = ({ onClick, item, shortcut }) => (
  <button className={styles.button} onClick={onClick}>
    {shortcut}) {formatText(item.label)}
  </button>
);
