import { ThemeInfo } from "@point-n-click/state";

type IndexSettings = {
  lang: string;
  themes: ThemeInfo[];
};

export const indexFile = (settings: IndexSettings) =>
  `import React from "react";
import { createRoot } from "react-dom/client";
import { registerTheme } from "@point-n-click/engine";
import { App, setClientSettings } from "@point-n-click/web-engine";
${settings.themes
  .map((t, index) => `import theme${1 + index} from "${t.themePackage}";\n`)
  .join("\n")}
${settings.themes
  .map(
    (t, index) =>
      `registerTheme(theme${1 + index}("${t.name}", ${JSON.stringify(
        t.settings
      )}));\n`
  )
  .join("\n")}setClientSettings({ currentLocale: "${settings.lang}" });

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
