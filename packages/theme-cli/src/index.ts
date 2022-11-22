import { Settings } from "./types";
import { Theme } from "@point-n-click/themes";
import packageDef from "../package.json";
import descriptionText from "@point-n-click/content-description-text";

const terminalTheme: Theme<Settings, [typeof descriptionText]> = (s) => ({
  name: "Terminal",
  author: packageDef.author,
  version: packageDef.version,
  packageName: packageDef.name,
  renderer: () => import("./TerminalTheme"),
  settings: { color: true, ...s },
  extensions: [descriptionText],
});

export default terminalTheme;
