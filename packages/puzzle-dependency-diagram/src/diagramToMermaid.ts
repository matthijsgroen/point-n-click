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

export const LOGIC_OR_STYLE: NodeStyle = {
  background: { color: "#999" },
  border: { color: "#000" },
  text: { color: "#000" },
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
  const classes: Record<string, string> = {
    chapter: styleToMermaidString(CHAPTER_STYLE),
  };

  const nodes = [
    "_start{{Start}}:::chapter",
    ...Object.entries(diagram).map(([key, data]) => {
      const filtered = !matchFilter(key);
      if (filtered) {
        classes["filtered"] = styleToMermaidString(FILTERED_STYLE);
      }

      return `${key}${shape(data.type, data.name ?? key)}${
        filtered ? ":::filtered" : data.type === "chapter" ? ":::chapter" : ""
      }`;
    }),
  ];

  const edges = Object.entries(diagram).flatMap(([key, data]) => {
    const dependencies = data.dependsOn ?? [];
    const matchesFilter = matchFilter(key);
    const orCondition = data.dependencyType === "or";

    const intermediateNodes: string[] = [];
    if (orCondition) {
      intermediateNodes.push(`_or_${key}{Or}:::logicOr`);
      classes["logicOr"] = styleToMermaidString(LOGIC_OR_STYLE);
    }

    const dependencyResult =
      dependencies.length === 0
        ? [matchesFilter ? `_start --> ${key}` : `_start -.-> ${key}`]
        : dependencies.map((dep) => {
            if (!evenList.includes(dep)) {
              classes["missingDep"] = styleToMermaidString(ERROR_STYLE);
              return orCondition
                ? `${dep}:::missingDep -.-x _or_${key}`
                : `${dep}:::missingDep ---x ${key}`;
            }
            if (matchFilter(dep) && matchesFilter && !orCondition) {
              return `${dep} --> ${key}`;
            }
            if (orCondition) {
              return `${dep} -.-> _or_${key}`;
            }
            return `${dep} -.-> ${key}`;
          });

    if (orCondition) {
      dependencyResult.push(`_or_${key} --> ${key}`);
    }

    return [...intermediateNodes, ...dependencyResult];
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
