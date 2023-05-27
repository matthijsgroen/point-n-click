import { DisplayErrorText } from "@point-n-click/types";
import styles from "./Error.module.css";
import React from "react";
import { formatText } from "../formatText";

export const Error: React.FC<{ content: DisplayErrorText }> = ({ content }) => {
  return (
    <div className={styles.error}>
      <h1>Error</h1>
      {content.message.map((value, row) => (
        <pre key={row}>{formatText(value)}</pre>
      ))}
    </div>
  );
};
