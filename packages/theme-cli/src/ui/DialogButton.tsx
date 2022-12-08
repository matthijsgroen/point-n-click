import React, { MouseEventHandler, PropsWithChildren } from "react";
import styles from "./DialogButton.module.css";

export type DialogButtonProps = PropsWithChildren<{
  onClick?: MouseEventHandler;
  value?: string;
}>;

export const DialogButton: React.FC<DialogButtonProps> = ({
  onClick,
  value,
  children,
}) => (
  <button
    className={styles.dialogButton}
    value={value}
    onClick={onClick}
    disabled={!onClick}
  >
    {children}
  </button>
);
