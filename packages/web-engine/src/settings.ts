import { settings } from "@point-n-click/engine";

const webClientSettings = settings<{
  skipMode: boolean;
  currentLocale: string;
}>({ skipMode: true, currentLocale: "en-US" });

export const setClientSettings = webClientSettings.update;
export const getClientSettings = webClientSettings.get;
