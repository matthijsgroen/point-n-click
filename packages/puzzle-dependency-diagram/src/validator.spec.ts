import { PuzzleDependencyDiagram } from "./types";
import { validateDiagram } from "./validator";

describe("validator", () => {
  it("accepts an empty document", () => {
    const diagram: PuzzleDependencyDiagram = {
      events: {},
    };
    const errors = validateDiagram(diagram);
    expect(errors).toHaveLength(0);
  });

  it("reports an error if a dependency is missing", () => {
    const diagram: PuzzleDependencyDiagram = {
      events: {
        openDoor: {
          dependsOn: ["getKey"],
        },
      },
    };
    const errors = validateDiagram(diagram);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual({
      message: "event 'openDoor' dependency 'getKey' is not defined.",
    });
  });
});
