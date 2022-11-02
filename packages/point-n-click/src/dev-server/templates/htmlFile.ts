type TemplateSettings = {
  title: string;
};

export const htmlFile = (settings: TemplateSettings) =>
  `<!DOCTYPE html>
<html lang="en">
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
