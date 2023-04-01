import { Settings } from "./types";
import { Theme } from "@point-n-click/themes";
import packageDef from "../package.json";
import descriptionText from "@point-n-click/content-description-text";

const extensions = [descriptionText] as const;

const terminalTheme: Theme<Settings, typeof extensions> = (name, settings) => ({
  name,
  author: packageDef.author,
  version: packageDef.version,
  packageName: packageDef.name,
  renderer: () => import("./TerminalTheme"),
  getTextContent: () => ({
    menu: "Menu",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    pause: "Game paused",
    continuePlaying: "Continue playing",
    saveGame: "Save game",
    loadGame: "Load game",
    close: "Close",
  }),
  settings: { color: true, ...settings },
  extensions,
});

export default terminalTheme;
