import {
  PuzzleDependencyDiagram,
  diagramToMermaid,
} from "@point-n-click/puzzle-dependency-diagram";

type TemplateSettings = {
  title: string;
  lang: string;
  diagram: PuzzleDependencyDiagram;
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
    <pre class="mermaid">
${diagramToMermaid(settings.diagram)}
    </pre>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true });
    </script>
  </body>
</html>`;
