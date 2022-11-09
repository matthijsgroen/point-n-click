import { Settings } from "./types";
import { Theme } from "@point-n-click/themes";
import packageDef from "../package.json";

const terminalTheme: Theme<Settings> = (s) => ({
  name: "Terminal",
  author: packageDef.author,
  version: packageDef.version,
  packageName: packageDef.name,
  renderer: () => import("./TerminalTheme"),
  settings: { color: true, ...s },
});

export default terminalTheme;
