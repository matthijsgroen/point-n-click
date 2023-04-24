import React from "react";
import { FC, PropsWithChildren } from "react";
import styles from "./ButtonGroup.module.css";

export const ButtonGroup: FC<PropsWithChildren> = ({ children }) => (
  <div className={styles.buttonGroup}>{children}</div>
);
