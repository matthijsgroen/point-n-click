import React from "react";
import styles from "./DialogSelect.module.css";

export type SelectOption<T> = {
  label: string;
  value: T;
};

type DialogSelectProps<T> = {
  label: string;
  options: SelectOption<T>[];
};

export const DialogSelect = <T,>({ label, options }: DialogSelectProps<T>) => {
  return (
    <label className={styles.dialogSelect}>
      {label}:{" "}
      <select>
        {options.map((item) => (
          <option key={item.label}>{item.label}</option>
        ))}
      </select>
    </label>
  );
};
