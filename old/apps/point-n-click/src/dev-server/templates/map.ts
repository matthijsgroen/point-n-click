type TemplateSettings = {
  title: string;
  lang: string;
  scriptPath: string;
};

export const htmlFile = (settings: TemplateSettings) =>
  `<!DOCTYPE html>
<html lang="${settings.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Map created using Point-n-click" />
    <title>${settings.title} World Map</title>
  </head>
  <body data-environment="development">
    <div id="root"></div>
    <script type="module" src="./${settings.scriptPath}"></script>
  </body>
</html>`;

export const scriptFile = () => `import React from "react";
import { createRoot } from "react-dom/client";
import { MapApp } from "@point-n-click/web-engine";

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <MapApp />
  </React.StrictMode>
);`;
