import { Settings } from "./types";
import { Theme } from "@point-n-click/themes";
import packageDef from "../package.json";
import descriptionText from "@point-n-click/content-description-text";
import noteLetter from "@point-n-click/content-note-letter";

const extensions = [descriptionText, noteLetter] as const;

const bookTheme: Theme<Settings, typeof extensions> = (name, settings) => ({
  name,
  author: packageDef.author,
  version: packageDef.version,
  packageName: packageDef.name,
  renderer: () => import("./BookTheme"),
  getTextContent: () => ({
    menu: "Menu",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    pause: "Game paused",
    continuePlaying: "Continue playing",
    saveGame: "Save game",
    loadGame: "Load game",
  }),
  settings: { coverColor: "red", ...settings },
  extensions,
});

export default bookTheme;
