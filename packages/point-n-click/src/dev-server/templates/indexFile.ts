import { ThemeInfo } from "@point-n-click/state";

type IndexSettings = {
  themes: ThemeInfo[];
};

export const indexFile = (settings: IndexSettings) =>
  `import React, {useState} from "react";
import { createRoot } from "react-dom/client";
import { App, registerTheme } from "@point-n-click/web-engine";
${settings.themes.map(
  (t, index) => `import theme${1 + index} from "${t.themePackage}";\n`
)}
${settings.themes.map(
  (t, index) =>
    `registerTheme("${t.themePackage}", theme${1 + index}, ${JSON.stringify(
      t.settings
    )});\n`
)}
const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
