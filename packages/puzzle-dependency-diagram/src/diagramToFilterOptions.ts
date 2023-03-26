import { PuzzleDependencyDiagram } from "./types";

export type FilterOptions<Diagram extends PuzzleDependencyDiagram> =
  Diagram extends PuzzleDependencyDiagram<infer States>
    ? { [Key in keyof States]?: (States[Key] | "_all")[] }
    : {};

const unique = <T>(e: T, i: number, l: T[]) => l.indexOf(e) === i;

export const diagramToFilterOptions = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram
): FilterOptions<Diagram> => {
  const result: Record<string, string[]> = {};
  Object.values(diagram).forEach((element) => {
    if (!element.tags) return;
    Object.entries(element.tags as Record<string, string | string[]>).forEach(
      ([element, value]) => {
        const list = result[element] || ["_all"];
        if (typeof value === "string") {
          result[element] = list.concat(value).filter(unique);
        } else {
          result[element] = list.concat(...value).filter(unique);
        }
      }
    );
  });

  return result as FilterOptions<Diagram>;
};
