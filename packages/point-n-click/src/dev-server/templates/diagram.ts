import { PuzzleDependencyDiagram } from "@point-n-click/puzzle-dependency-diagram";

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
    <meta name="description" content="Diagram created using Point-n-click" />
    <title>${settings.title} Puzzle Dependency Chart</title>
  </head>
  <body data-environment="development">
    <div id="root"></div>
    <script type="module" src="./diagram.tsx"></script>
  </body>
</html>`;

export const scriptFile = () => `import React from "react";
import { createRoot } from "react-dom/client";
import { DiagramApp } from "@point-n-click/web-engine";

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <DiagramApp />
  </React.StrictMode>
);`;
