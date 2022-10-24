import { settings } from "@point-n-click/engine";

export const terminalSettings = settings<{ skipScreen: boolean }>({
  skipScreen: false,
});
