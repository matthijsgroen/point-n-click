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
    <meta name="description" content="Diagram created using Point-n-click" />
    <title>${settings.title} Puzzle Dependency Chart</title>
  </head>
  <body data-environment="development">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="./diagram.tsx" />
  </body>
</html>`;

export const indexFile = () => {
  return `import React from "react";
import { createRoot } from "react-dom/client";

const root = createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <div>
      <p>Hello world!</p>
    </div>
  </React.StrictMode>
);`;
};
