import React from "react";
import { forwardRef, PropsWithChildren } from "react";
import styles from "./Dialog.module.css";

export const Dialog = forwardRef<HTMLDialogElement, PropsWithChildren>(
  ({ children }, ref) => (
    <dialog ref={ref} className={styles.dialog}>
      {children}
    </dialog>
  )
);
