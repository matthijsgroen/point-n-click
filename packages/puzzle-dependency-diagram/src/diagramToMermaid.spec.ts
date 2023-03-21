import {
  diagramToMermaid,
  ERROR_STYLE,
  FILTERED_STYLE,
} from "./diagramToMermaid";
import { styleToMermaidString } from "./mermaidStyle";
import { PuzzleDependencyDiagram } from "./types";

describe(diagramToMermaid, () => {
  it("creates an empty diagram", () => {
    const diagram: PuzzleDependencyDiagram = {};
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual(["flowchart TD", "  _start{{Start}}"]);
  });

  it("adds nodes", () => {
    const diagram: PuzzleDependencyDiagram = {
      openDoor: {},
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  openDoor(openDoor)",
      "  _start --> openDoor",
    ]);
  });

  it("supports custom labels", () => {
    const diagram: PuzzleDependencyDiagram = {
      openDoor: { name: "open the door" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  openDoor(open the door)",
      "  _start --> openDoor",
    ]);
  });

  it("supports creates edges for dependencies", () => {
    const diagram: PuzzleDependencyDiagram = {
      getKey: {},
      openDoor: { dependsOn: ["getKey"], name: "open the door" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  getKey(getKey)",
      "  openDoor(open the door)",
      "  _start --> getKey",
      "  getKey --> openDoor",
    ]);
  });

  it("supports task as puzzle type", () => {
    const diagram: PuzzleDependencyDiagram = {
      getStrong: { type: "task" },
      openDoor: { dependsOn: ["getStrong"], name: "open the door" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  getStrong[[getStrong]]",
      "  openDoor(open the door)",
      "  _start --> getStrong",
      "  getStrong --> openDoor",
    ]);
  });

  it("shows missing dependencies", () => {
    const diagram: PuzzleDependencyDiagram = {
      openDoor: { dependsOn: ["getStrong"], name: "open the door" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  openDoor(open the door)",
      "  getStrong:::missingDep ---x openDoor",
      `  classDef missingDep ${styleToMermaidString(ERROR_STYLE)};`,
    ]);
  });

  describe("filtering", () => {
    type MetaData = {
      state: "todo" | "done";
    };

    it("shows items not matching filter as dotted", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {
          tags: {
            state: "done",
          },
        },
        openDoor: { dependsOn: ["getKey"], name: "open the door" },
      };
      const result = diagramToMermaid(diagram, { state: "done" });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)};`,
      ]);
    });

    it("shows items not matching filter as dotted (start node arrow)", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {},
        openDoor: {
          dependsOn: ["getKey"],
          name: "open the door",
          tags: {
            state: "done",
          },
        },
      };
      const result = diagramToMermaid(diagram, { state: "done" });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)};`,
      ]);
    });
  });
});
