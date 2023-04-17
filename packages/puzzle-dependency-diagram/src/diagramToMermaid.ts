import { FilterOptions } from "./diagramToFilterOptions";
import { styleToMermaidString } from "./mermaidStyle";
import {
  CHAPTER_STYLE,
  ERROR_STYLE,
  FILTERED_DEPS_STYLE,
  FILTERED_STYLE,
  GROUP_STYLE,
  LOGIC_OR_STYLE,
} from "./styles";
import { PuzzleDependencyDiagram, PuzzleEvent } from "./types";

const shape = (type: PuzzleEvent["type"], label: string): string =>
  type === "task"
    ? `[[${label}]]`
    : type === "chapter"
    ? `{{${label}}}`
    : `(${label})`;

export type RenderMode = "default" | "overview" | "hierarchy";

type RenderOptions<Diagram extends PuzzleDependencyDiagram> = {
  filter?: FilterOptions<Diagram>;
  renderMode?: RenderMode;
};

const FILTER_PASS = 0;
const FILTER_FAIL = 1;
const FILTER_DEPS = 2;

const m = (text: TemplateStringsArray, ...values: string[]): string =>
  text
    .map((term, index, list) => {
      if (index < list.length - 1) {
        const sanitizedValue =
          values[index] === "end" ? "_end_" : values[index];

        return `${term}${sanitizedValue}`;
      }
      return term;
    })
    .join("");

const getMatchFilter = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram,
  options?: RenderOptions<Diagram>
) => {
  const filter: FilterOptions<Diagram> =
    options?.filter ?? ({} as FilterOptions<Diagram>);
  return (nodeName: string): boolean => {
    const node = diagram[nodeName];
    if (!node) return false;
    const tags = node.tags as Record<string, string> | undefined;
    return Object.entries<string[]>(filter).every(
      ([key, values]) =>
        (values.includes("_all") &&
          (tags === undefined || tags[key] === undefined)) ||
        (tags &&
          tags[key] &&
          values.some((value) =>
            typeof tags[key] === "string"
              ? tags[key] === value
              : tags[key].includes(value)
          ))
    );
  };
};

const defineClasses = (classes: Record<string, string>): string[] =>
  Object.entries(classes).map(
    ([className, styling]) => `classDef ${className} ${styling}`
  );

const defineEdges = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram,
  options?: RenderOptions<Diagram>
): string[] => {
  const matchFilter = getMatchFilter(diagram, options);
  const evenList = Object.keys(diagram);
  const classes: Record<string, string> = {};

  return [
    ...Object.entries(diagram).flatMap(([key, data]) => {
      const dependencies = data.dependsOn ?? [];
      const orCondition = data.gateType === "or";

      const dependencyResult =
        dependencies.length === 0
          ? [m`_start --> ${key}`]
          : dependencies.map((dep) => {
              if (!evenList.includes(dep)) {
                classes["missingDep"] = styleToMermaidString(ERROR_STYLE);
                return orCondition
                  ? m`${dep}:::missingDep -.-x _or_${key}`
                  : m`${dep}:::missingDep ---x ${key}`;
              }
              if (matchFilter(dep) && !orCondition) {
                return m`${dep} --> ${key}`;
              }
              if (orCondition) {
                return m`${dep} -.-> _or_${key}`;
              }
              return m`${dep} -.-> ${key}`;
            });

      if (orCondition) {
        dependencyResult.push(m`_or_${key} --> ${key}`);
      }

      return dependencyResult;
    }),
    ...defineClasses(classes),
  ];
};

type TreeNode = {
  nodes: string[];
  subTrees: {
    [key: string]: TreeNode;
  };
};

const renderTreeNodes = (tree: TreeNode): string[] => {
  const result = tree.nodes;
  const nestings = Object.entries(tree.subTrees).flatMap(
    ([subTreeName, tree]) => [
      `subgraph ${subTreeName}`,
      ...renderTreeNodes(tree).map((l) => `  ${l}`),
      "end",
    ]
  );
  return result.concat(nestings);
};

const unique = <T>(t: T, i: number, l: T[]): boolean => l.indexOf(t) === i;

const defineNodes = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram,
  options?: RenderOptions<Diagram>
): string[] => {
  const renderHierarchy = options?.renderMode === "hierarchy";
  const matchFilter = getMatchFilter(diagram, options);
  const classes: Record<string, string> = {
    chapter: styleToMermaidString(CHAPTER_STYLE),
  };

  const tree: TreeNode = {
    nodes: [],
    subTrees: {},
  };

  const getTreeNode = (
    tree: TreeNode,
    [head, ...tail]: string[] = []
  ): TreeNode => {
    if (!head) {
      return tree;
    }
    const subTree = (tree.subTrees[head] = tree.subTrees[head] ?? {
      nodes: [],
      subTrees: {},
    });
    return getTreeNode(subTree, tail);
  };
  const groupClasses: string[] = [];

  Object.entries(diagram).forEach(([key, data]) => {
    const filtered = !matchFilter(key);
    const depsFiltered = (data.dependsOn ?? []).every((dep) =>
      matchFilter(dep)
    );

    const filterType =
      filtered && depsFiltered
        ? FILTER_DEPS
        : filtered
        ? FILTER_FAIL
        : FILTER_PASS;

    if (filterType === FILTER_FAIL) {
      classes["filtered"] = styleToMermaidString(FILTERED_STYLE);
    }
    if (filterType === FILTER_DEPS) {
      classes["filteredDeps"] = styleToMermaidString(FILTERED_DEPS_STYLE);
    }

    const styling =
      filterType === FILTER_FAIL
        ? ":::filtered"
        : filterType === FILTER_DEPS
        ? ":::filteredDeps"
        : data.type === "chapter"
        ? ":::chapter"
        : "";

    const node = m`${key}${shape(data.type, data.name ?? key)}${styling}`;

    if (data.hierarchy && renderHierarchy) groupClasses.push(...data.hierarchy);

    const treeNode = getTreeNode(tree, renderHierarchy ? data.hierarchy : []);
    if (data.gateType === "or") {
      treeNode.nodes.push(m`_or_${key}{Or}:::logicOr`);
      classes["logicOr"] = styleToMermaidString(LOGIC_OR_STYLE);
    }

    treeNode.nodes.push(node);
  });

  const groupIds = groupClasses.filter(unique);
  if (groupIds.length > 0) {
    classes["group"] = styleToMermaidString(GROUP_STYLE);
  }

  const classList: string[] =
    groupIds.length > 0 ? [`class ${groupIds.join(",")} group`] : [];

  const nodes = [
    "_start{{Start}}:::chapter",
    ...renderTreeNodes(tree),
    ...classList,
    ...defineClasses(classes),
  ];

  return nodes;
};

const matchColors = ["#511", "#331", "#281", "#090"];

export const getMatchColor = (match: number, amount: number) =>
  matchColors[Math.floor((match / amount) * (matchColors.length - 1))];

const diagramToMermaidOverview = <Diagram extends PuzzleDependencyDiagram>(
  diagram: PuzzleDependencyDiagram,
  options: RenderOptions<Diagram>
): string => {
  type HierarchyNode = {
    name: string;
    amount: number;
    match: number;
    children: Record<string, HierarchyNode>;
  };
  const tree: Record<string, HierarchyNode> = {};
  const matchFilter = getMatchFilter(diagram, options);

  const stylings: Record<string, string> = {};

  Object.entries(diagram).forEach(([name, event]) => {
    const hierarchy = event.hierarchy ?? ["_all"];

    let parent = tree;
    for (const level of hierarchy) {
      const item = parent[level] || {
        name: level,
        amount: 0,
        match: 0,
        children: {},
      };
      parent[level] = item;

      item.amount++;
      if (matchFilter(name)) {
        item.match++;
      }

      parent = item.children;
    }
  });

  const renderHierarchyGraph = (
    level: Record<string, HierarchyNode>
  ): string[] =>
    Object.values(level).flatMap((item) => {
      stylings[item.name] = `fill:${getMatchColor(item.match, item.amount)}`;
      if (Object.keys(item.children).length > 0) {
        return [
          `subgraph ${item.name}[${item.name} ${item.match} / ${item.amount}]`,
          ...renderHierarchyGraph(item.children).map((e) => `  ${e}`),
          "end",
        ];
      }
      return [`${item.name}(${item.name} ${item.match} / ${item.amount})`];
    });

  return [
    "flowchart TD",
    ...renderHierarchyGraph(tree).map((e) => `  ${e}`),
    ...(options.filter
      ? Object.entries(stylings).map(
          ([k, color]) => `  style ${k} ${color},text:#fff`
        )
      : []),
  ].join("\n");
};

export const diagramToMermaid = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram,
  options?: RenderOptions<Diagram>
): string => {
  if (options?.renderMode === "overview") {
    return diagramToMermaidOverview(diagram, options);
  }
  const nodes = defineNodes(diagram, options);
  const edges = defineEdges(diagram, options);

  return [
    "flowchart TD",
    ...nodes.map((node) => `  ${node}`),
    ...edges.map((edge) => `  ${edge}`),
  ].join("\n");
};
