import {
  CHAPTER_STYLE,
  diagramToMermaid,
  ERROR_STYLE,
  FILTERED_STYLE,
  LOGIC_OR_STYLE,
} from "./diagramToMermaid";
import { styleToMermaidString } from "./mermaidStyle";
import { PuzzleDependencyDiagram } from "./types";

describe(diagramToMermaid, () => {
  it("creates an empty diagram", () => {
    const diagram: PuzzleDependencyDiagram = {};
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}:::chapter",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
    ]);
  });

  it("adds nodes", () => {
    const diagram: PuzzleDependencyDiagram = {
      openDoor: {},
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}:::chapter",
      "  openDoor(openDoor)",
      "  _start --> openDoor",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
    ]);
  });

  it("supports custom labels", () => {
    const diagram: PuzzleDependencyDiagram = {
      openDoor: { name: "open the door" },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}:::chapter",
      "  openDoor(open the door)",
      "  _start --> openDoor",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  getKey(getKey)",
      "  openDoor(open the door)",
      "  _start --> getKey",
      "  getKey --> openDoor",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  getStrong[[getStrong]]",
      "  openDoor(open the door)",
      "  _start --> getStrong",
      "  getStrong --> openDoor",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
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
      "  _start{{Start}}:::chapter",
      "  openDoor(open the door)",
      "  getStrong:::missingDep ---x openDoor",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
      `  classDef missingDep ${styleToMermaidString(ERROR_STYLE)}`,
    ]);
  });

  describe("'or' conditions", () => {
    it("add a logic gate in between", () => {
      const diagram: PuzzleDependencyDiagram = {
        threeTrials: {},
        buyShip: {},
        startJourney: {
          dependsOn: ["buyShip", "threeTrials"],
          dependencyType: "or",
        },
      };
      const result = diagramToMermaid(diagram);
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  threeTrials(threeTrials)",
        "  buyShip(buyShip)",
        "  startJourney(startJourney)",
        "  _start --> threeTrials",
        "  _start --> buyShip",
        "  _or_startJourney{Or}:::logicOr",
        "  buyShip -.-> _or_startJourney",
        "  threeTrials -.-> _or_startJourney",
        "  _or_startJourney --> startJourney",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef logicOr ${styleToMermaidString(LOGIC_OR_STYLE)}`,
      ]);
    });

    it("missing dependency in or", () => {
      const diagram: PuzzleDependencyDiagram = {
        threeTrials: {},
        startJourney: {
          dependsOn: ["buyShip", "threeTrials"],
          dependencyType: "or",
        },
      };
      const result = diagramToMermaid(diagram);
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  threeTrials(threeTrials)",
        "  startJourney(startJourney)",
        "  _start --> threeTrials",
        "  _or_startJourney{Or}:::logicOr",
        "  buyShip:::missingDep -.-x _or_startJourney",
        "  threeTrials -.-> _or_startJourney",
        "  _or_startJourney --> startJourney",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef logicOr ${styleToMermaidString(LOGIC_OR_STYLE)}`,
        `  classDef missingDep ${styleToMermaidString(ERROR_STYLE)}`,
      ]);
    });
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
        "  _start{{Start}}:::chapter",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure)",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor --> startAdventure",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure):::filtered",
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
        "  _start{{Start}}:::chapter",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  startAdventure(startAdventure):::filtered",
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
      ]);
    });
  });
});
