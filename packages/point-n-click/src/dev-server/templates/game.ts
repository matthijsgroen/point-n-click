import { ThemeInfo } from "@point-n-click/state";

type TemplateSettings = {
  title: string;
  lang: string;
};

export const htmlFile = (settings: TemplateSettings) =>
  `<!DOCTYPE html>
<html lang="${settings.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Game created using Point-n-click" />
    <title>${settings.title} development server</title>
  </head>
  <body data-environment="development">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="./index.tsx" />
  </body>
</html>`;

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
