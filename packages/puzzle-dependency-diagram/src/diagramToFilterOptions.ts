import { PuzzleDependencyDiagram } from "./types";

export type FilterOptions<Diagram extends PuzzleDependencyDiagram> =
  Diagram extends PuzzleDependencyDiagram<infer States>
    ? { [Key in keyof States]?: (States[Key] | "_all")[] }
    : {};

export const diagramToFilterOptions = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram
): FilterOptions<Diagram> => {
  const result: Record<string, string[]> = {};
  Object.values(diagram).forEach((element) => {
    if (!element.tags) return;
    Object.entries(element.tags as Record<string, string>).forEach(
      ([element, value]) => {
        const list = result[element] || ["_all"];
        if (!list.includes(value)) {
          result[element] = list.concat(value);
        }
      }
    );
  });

  return result as FilterOptions<Diagram>;
};
