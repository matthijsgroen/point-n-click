import { diagramToFilterOptions } from "./diagramToFilterOptions";
import { PuzzleDependencyDiagram } from "./types";

describe(diagramToFilterOptions, () => {
  describe("returning available options based on content", () => {
    it("returns empty model when no tags set", () => {
      const diagram: PuzzleDependencyDiagram<{
        state: "todo" | "progress";
        release: "1.0";
      }> = {
        hello: {},
      };

      const result = diagramToFilterOptions(diagram);
      expect(result).toEqual({});
    });
    it("returns  model based on encountered values", () => {
      const diagram: PuzzleDependencyDiagram<{
        state: "todo" | "progress";
        release: "1.0" | "2.0";
        unused: "so not available";
      }> = {
        hello: { tags: { state: "todo" } },
        bye: { tags: { state: "progress", release: "1.0" } },
        something: {
          dependsOn: ["hello"],
          tags: { release: "1.0" },
        },
      };

      const result = diagramToFilterOptions(diagram);
      expect(result).toEqual({
        state: ["_all", "todo", "progress"],
        release: ["_all", "1.0"],
      });
    });
  });
});
