import { settings } from "@point-n-click/engine";

const webClientSettings = settings<{ skipMode: boolean }>({ skipMode: true });

export const setClientSettings = webClientSettings.update;
export const getClientSettings = webClientSettings.get;
