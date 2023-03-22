import { FilterOptions } from "./diagramToFilterOptions";
import { NodeStyle, styleToMermaidString } from "./mermaidStyle";
import { PuzzleDependencyDiagram, PuzzleEvent } from "./types";

const shape = (type: PuzzleEvent["type"], label: string): string =>
  type === "task"
    ? `[[${label}]]`
    : type === "chapter"
    ? `{{${label}}}`
    : `(${label})`;

export const FILTERED_STYLE: NodeStyle = {
  border: {
    width: 1,
    style: "dashed",
  },
  background: { color: "#111" },
  text: { color: "#666" },
};

export const ERROR_STYLE: NodeStyle = {
  background: { color: "#933" },
  border: { color: "#333" },
  text: { color: "#000" },
};

export const CHAPTER_STYLE: NodeStyle = {
  background: { color: "#393" },
  border: { color: "#3f3" },
  text: { color: "#000" },
};

export const diagramToMermaid = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram,
  filter?: FilterOptions<Diagram>
): string => {
  const matchFilter = (nodeName: string): boolean => {
    const item = diagram[nodeName];
    if (!item) return false;
    const tags = item.tags as Record<string, string> | undefined;
    return Object.entries<string[]>(filter ?? {}).every(
      ([key, values]) =>
        (values.includes("_all") &&
          (tags === undefined || tags[key] === undefined)) ||
        (tags && values.includes(tags[key]))
    );
  };
  const evenList = Object.keys(diagram);
  const classes: Record<string, string> = {};

  const nodes = [
    "_start{{Start}}",
    ...Object.entries(diagram).map(([key, data]) => {
      const filtered = !matchFilter(key);
      if (filtered) {
        classes["filtered"] = styleToMermaidString(FILTERED_STYLE);
      }
      if (data.type === "chapter") {
        classes["chapter"] = styleToMermaidString(CHAPTER_STYLE);
      }

      return `${key}${shape(data.type, data.name ?? key)}${
        filtered ? ":::filtered" : data.type === "chapter" ? ":::chapter" : ""
      }`;
    }),
  ];

  const edges = Object.entries(diagram).flatMap(([key, data]) => {
    const dependencies = data.dependsOn ?? [];
    const matchesFilter = matchFilter(key);

    return dependencies.length === 0
      ? [matchesFilter ? `_start --> ${key}` : `_start -.-> ${key}`]
      : dependencies.map((dep) => {
          if (!evenList.includes(dep)) {
            classes["missingDep"] = styleToMermaidString(ERROR_STYLE);
            return `${dep}:::missingDep ---x ${key}`;
          }
          if (matchFilter(dep) && matchesFilter) {
            return `${dep} --> ${key}`;
          }
          return `${dep} -.-> ${key}`;
        });
  });

  const classList = Object.entries(classes).map(
    ([className, styling]) => `classDef ${className} ${styling}`
  );

  return [
    "flowchart TD",
    ...nodes.map((node) => `  ${node}`),
    ...edges.map((edge) => `  ${edge}`),
    ...classList.map((classStyling) => `  ${classStyling}`),
  ].join("\n");
};
