import { settings } from "@point-n-click/engine";

export type CLISettings = {
  /**
   * Wether to use colors in the TTY.
   * @default true
   */
  color?: boolean;
};

const cliSettings = settings<CLISettings>({ color: true });

export const getSettings = cliSettings.get;
export const updateSettings = cliSettings.update;
