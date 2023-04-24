import { Locale } from "@point-n-click/state";
import { TranslationFile } from "@point-n-click/types";
import { useGameLocale, useGameTheme } from "@point-n-click/web-engine";
import React from "react";
import { forwardRef } from "react";
import { DialogButton } from "../ui/DialogButton";
import { DialogSelect, SelectOption } from "../ui/DialogSelect";
import { ButtonGroup } from "./ButtonGroup";
import { Dialog } from "./Dialog";

type Props = {
  translations: TranslationFile;
  onClose?: () => void;
};

export const SettingsDialog = forwardRef<HTMLDialogElement, Props>(
  ({ translations, onClose }, ref) => {
    const { locale, supportedLocales, setLocale } = useGameLocale();
    const { theme, availableThemes, setTheme } = useGameTheme();

    const languageOptions: SelectOption<Locale>[] = Object.entries(
      supportedLocales
    ).map<SelectOption<Locale>>(([key, value]) => ({
      label: value,
      value: key as Locale,
    }));

    const themeOptions: SelectOption<number>[] = availableThemes.map<
      SelectOption<number>
    >((theme) => ({
      label: theme.name,
      value: theme.index,
    }));
    return (
      <Dialog ref={ref}>
        <form method="dialog">
          <h1>{translations["settings"] as string}</h1>
          <ButtonGroup>
            <DialogSelect
              label={translations["theme"] as string}
              options={themeOptions}
              selected={theme.index}
              onSelect={(newValue) => {
                setTheme(availableThemes[newValue]);
              }}
            />
            <DialogSelect
              label={translations["language"] as string}
              options={languageOptions}
              selected={locale}
              onSelect={(newValue) => {
                setLocale(newValue);
              }}
            />
            <DialogButton>Text speed</DialogButton>
          </ButtonGroup>
          <ButtonGroup>
            <DialogButton value="close" onClick={onClose}>
              Close
            </DialogButton>
          </ButtonGroup>
        </form>
      </Dialog>
    );
  }
);
