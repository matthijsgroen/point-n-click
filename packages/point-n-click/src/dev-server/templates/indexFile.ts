import { ThemeInfo } from "@point-n-click/state";

type IndexSettings = {
  lang: string;
  themes: ThemeInfo[];
};

export const indexFile = (settings: IndexSettings) => {
  const packages = settings.themes
    .map((t) => t.themePackage)
    .filter((v, i, a) => a.indexOf(v) === i);
  return `import React from "react";
import { createRoot } from "react-dom/client";
import { registerTheme } from "@point-n-click/engine";
import { App, setClientSettings } from "@point-n-click/web-engine";
${packages
  .map((t, index) => `import theme${1 + index} from "${t}";`)
  .join("\n")}
${settings.themes
  .map(
    (t, index) =>
      `registerTheme(theme${1 + packages.indexOf(t.themePackage)}("${
        t.name
      }", ${JSON.stringify(t.settings)}));`
  )
  .join("\n")}
setClientSettings({ currentLocale: "${settings.lang}" });

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
};
