import React from "react";
import styles from "./DialogSelect.module.css";

export type SelectOption<T> = {
  label: string;
  value: T;
};

type DialogSelectProps<T> = {
  label: string;
  options: SelectOption<T>[];
  selected?: T;
  onSelect?: (newValue: T) => void;
};

export const DialogSelect = <T,>({
  label,
  options,
  selected,
  onSelect,
}: DialogSelectProps<T>) => {
  return (
    <label className={styles.dialogSelect}>
      <span>{label}: </span>
      <select
        onChange={(event) => {
          if (!onSelect) {
            return;
          }
          const selectedLabel = event.target.value;
          const option = options.find(
            (option) => option.label === selectedLabel
          );
          if (option) {
            onSelect(option.value);
          }
        }}
      >
        {options.map((item) => (
          <option key={item.label} selected={item.value === selected}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};
