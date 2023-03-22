import {
  CHAPTER_STYLE,
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

  it("supports chapter as puzzle type", () => {
    const diagram: PuzzleDependencyDiagram = {
      threeTrials: { type: "task" },
      buyShip: {},
      startJourney: { dependsOn: ["buyShip", "threeTrials"], type: "chapter" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}",
      "  threeTrials[[threeTrials]]",
      "  buyShip(buyShip)",
      "  startJourney{{startJourney}}:::chapter",
      "  _start --> threeTrials",
      "  _start --> buyShip",
      "  buyShip --> startJourney",
      "  threeTrials --> startJourney",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      `  classDef missingDep ${styleToMermaidString(ERROR_STYLE)}`,
    ]);
  });

  describe("filtering", () => {
    type MetaData = {
      state: "todo" | "done" | "progress";
      location: "farm" | "hills";
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
      const result = diagramToMermaid(diagram, { state: ["done"] });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
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
      const result = diagramToMermaid(diagram, { state: ["done"] });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
      ]);
    });

    it("matches either value of the same filter", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {},
        openDoor: {
          dependsOn: ["getKey"],
          name: "open the door",
          tags: {
            state: "done",
          },
        },
        startAdventure: {
          dependsOn: ["openDoor"],
          tags: {
            state: "progress",
          },
        },
      };
      const result = diagramToMermaid(diagram, { state: ["done", "progress"] });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure)",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor --> startAdventure",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
      ]);
    });

    it("matches all set filters", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {},
        openDoor: {
          dependsOn: ["getKey"],
          name: "open the door",
          tags: {
            state: "done",
            location: "farm",
          },
        },
        startAdventure: {
          dependsOn: ["openDoor"],
          tags: {
            state: "done",
            location: "hills",
          },
        },
      };
      const result = diagramToMermaid(diagram, {
        state: ["done", "progress"],
        location: ["farm"],
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure):::filtered",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
      ]);
    });

    it("you can use _all to match unset values", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {},
        openDoor: {
          dependsOn: ["getKey"],
          name: "open the door",
          tags: {
            state: "done",
            location: "farm",
          },
        },
        startAdventure: {
          dependsOn: ["openDoor"],
          tags: {
            state: "done",
            location: "hills",
          },
        },
      };
      const result = diagramToMermaid(diagram, {
        state: ["_all"],
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  startAdventure(startAdventure):::filtered",
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
      ]);
    });
  });
});
