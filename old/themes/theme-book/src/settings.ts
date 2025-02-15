import { settings } from "@point-n-click/engine";

export const bookSettings = settings<{ skipScreen: boolean }>({
  skipScreen: false,
});
