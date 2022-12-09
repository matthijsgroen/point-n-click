import { settings } from "@point-n-click/engine";
import { Locale } from "@point-n-click/state";

const webClientSettings = settings<{
  skipMode: boolean;
  currentLocale: Locale;
}>({ skipMode: true, currentLocale: "en-US" });

export const setClientSettings = webClientSettings.update;
export const getClientSettings = webClientSettings.get;
export const subscribeClientSettings = webClientSettings.subscribe;
