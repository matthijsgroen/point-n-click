import { settings } from "@point-n-click/engine";
import { Locale } from "@point-n-click/types";

const webClientSettings = settings<{
  skipMode: boolean;
  currentLocale: Locale;
  currentTheme: number;
}>({ skipMode: true, currentTheme: 0, currentLocale: "en-US" });

export const setClientSettings = webClientSettings.update;
export const getClientSettings = webClientSettings.get;
export const subscribeClientSettings = webClientSettings.subscribe;
