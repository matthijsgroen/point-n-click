import { diagramToMermaid } from "./diagramToMermaid";
import { styleToMermaidString } from "./mermaidStyle";
import {
  CHAPTER_STYLE,
  ERROR_STYLE,
  FILTERED_STYLE,
  GROUP_STYLE,
  LOGIC_OR_STYLE,
} from "./styles";
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
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  openDoor(open the door)",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  getKey(getKey)",
      "  openDoor(open the door)",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  getStrong[[getStrong]]",
      "  openDoor(open the door)",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
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
      "  _start{{Start}}:::chapter",
      "  threeTrials[[threeTrials]]",
      "  buyShip(buyShip)",
      "  startJourney{{startJourney}}:::chapter",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
      "  _start --> threeTrials",
      "  _start --> buyShip",
      "  buyShip --> startJourney",
      "  threeTrials --> startJourney",
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
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
      "  getStrong:::missingDep ---x openDoor",
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
          gateType: "or",
        },
      };
      const result = diagramToMermaid(diagram);
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  threeTrials(threeTrials)",
        "  buyShip(buyShip)",
        "  _or_startJourney{Or}:::logicOr",
        "  startJourney(startJourney)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef logicOr ${styleToMermaidString(LOGIC_OR_STYLE)}`,
        "  _start --> threeTrials",
        "  _start --> buyShip",
        "  buyShip -.-> _or_startJourney",
        "  threeTrials -.-> _or_startJourney",
        "  _or_startJourney --> startJourney",
      ]);
    });

    it("missing dependency in or", () => {
      const diagram: PuzzleDependencyDiagram = {
        threeTrials: {},
        startJourney: {
          dependsOn: ["buyShip", "threeTrials"],
          gateType: "or",
        },
      };
      const result = diagramToMermaid(diagram);
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  threeTrials(threeTrials)",
        "  _or_startJourney{Or}:::logicOr",
        "  startJourney(startJourney)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef logicOr ${styleToMermaidString(LOGIC_OR_STYLE)}`,
        "  _start --> threeTrials",
        "  buyShip:::missingDep -.-x _or_startJourney",
        "  threeTrials -.-> _or_startJourney",
        "  _or_startJourney --> startJourney",
        `  classDef missingDep ${styleToMermaidString(ERROR_STYLE)}`,
      ]);
    });
  });

  it("avoids placing the word 'end' in the diagram, since it is a reserved term", () => {
    const diagram: PuzzleDependencyDiagram = {
      end: {},
      openDoor: { dependsOn: ["end"] },
    };
    const result = diagramToMermaid(diagram);
    expect(result.split("\n")).toEqual([
      "flowchart TD",
      "  _start{{Start}}:::chapter",
      "  _end_(end)",
      "  openDoor(openDoor)",
      `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
      "  _start --> _end_",
      "  _end_ --> openDoor",
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
      const result = diagramToMermaid(diagram, { filter: { state: ["done"] } });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start --> getKey",
        "  getKey -.-> openDoor",
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
      const result = diagramToMermaid(diagram, { filter: { state: ["done"] } });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
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
      const result = diagramToMermaid(diagram, {
        filter: { state: ["done", "progress"] },
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor --> startAdventure",
      ]);
    });

    it("matches either value of the same filter (multiple tag values)", () => {
      const diagram: PuzzleDependencyDiagram<MetaData> = {
        getKey: {},
        openDoor: {
          dependsOn: ["getKey"],
          name: "open the door",
          tags: {
            state: ["done", "progress"],
          },
        },
        startAdventure: {
          dependsOn: ["openDoor"],
          tags: {
            state: "progress",
          },
        },
      };
      const result = diagramToMermaid(diagram, {
        filter: { state: ["progress"] },
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor --> startAdventure",
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
        filter: {
          state: ["done", "progress"],
          location: ["farm"],
        },
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey):::filtered",
        "  openDoor(open the door)",
        "  startAdventure(startAdventure):::filtered",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start -.-> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
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
        filter: {
          state: ["_all"],
        },
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey)",
        "  openDoor(open the door):::filtered",
        "  startAdventure(startAdventure):::filtered",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef filtered ${styleToMermaidString(FILTERED_STYLE)}`,
        "  _start --> getKey",
        "  getKey -.-> openDoor",
        "  openDoor -.-> startAdventure",
      ]);
    });
  });

  describe("hierarchy", () => {
    it("supports render option to show hierarchies, set to false", () => {
      const diagram: PuzzleDependencyDiagram = {
        getKey: { hierarchy: ["tower"] },
        openDoor: {
          dependsOn: ["getKey"],
          hierarchy: ["dungeon"],
        },
        startAdventure: {
          dependsOn: ["openDoor"],
        },
      };
      const result = diagramToMermaid(diagram, {
        renderHierarchy: false,
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  getKey(getKey)",
        "  openDoor(openDoor)",
        "  startAdventure(startAdventure)",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        "  _start --> getKey",
        "  getKey --> openDoor",
        "  openDoor --> startAdventure",
      ]);
    });

    it("supports render option to show hierarchies, set to true", () => {
      const diagram: PuzzleDependencyDiagram = {
        getKey: { hierarchy: ["tower"] },
        openDoor: {
          dependsOn: ["getKey"],
          hierarchy: ["dungeon"],
        },
        startAdventure: {
          dependsOn: ["openDoor"],
        },
      };
      const result = diagramToMermaid(diagram, {
        renderHierarchy: true,
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  startAdventure(startAdventure)",
        "  subgraph tower",
        "    getKey(getKey)",
        "  end",
        "  subgraph dungeon",
        "    openDoor(openDoor)",
        "  end",
        "  class tower,dungeon group",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef group ${styleToMermaidString(GROUP_STYLE)}`,
        "  _start --> getKey",
        "  getKey --> openDoor",
        "  openDoor --> startAdventure",
      ]);
    });

    it("supports render option to show hierarchies deep hierarchies", () => {
      const diagram: PuzzleDependencyDiagram = {
        getKey: { hierarchy: ["tower"] },
        openDoor: {
          dependsOn: ["getKey"],
          hierarchy: ["castle", "dungeon"],
        },
        startAdventure: {
          dependsOn: ["openDoor"],
          hierarchy: ["tower"],
        },
      };
      const result = diagramToMermaid(diagram, {
        renderHierarchy: true,
      });
      expect(result.split("\n")).toEqual([
        "flowchart TD",
        "  _start{{Start}}:::chapter",
        "  subgraph tower",
        "    getKey(getKey)",
        "    startAdventure(startAdventure)",
        "  end",
        "  subgraph castle",
        "    subgraph dungeon",
        "      openDoor(openDoor)",
        "    end",
        "  end",
        "  class tower,castle,dungeon group",
        `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
        `  classDef group ${styleToMermaidString(GROUP_STYLE)}`,
        "  _start --> getKey",
        "  getKey --> openDoor",
        "  openDoor --> startAdventure",
      ]);
    });

    describe("'or' conditions", () => {
      it("add a logic gate in between on same hierarchy level", () => {
        const diagram: PuzzleDependencyDiagram = {
          threeTrials: {},
          buyShip: {},
          startJourney: {
            dependsOn: ["buyShip", "threeTrials"],
            gateType: "or",
            hierarchy: ["harbor"],
          },
        };
        const result = diagramToMermaid(diagram, { renderHierarchy: true });
        expect(result.split("\n")).toEqual([
          "flowchart TD",
          "  _start{{Start}}:::chapter",
          "  threeTrials(threeTrials)",
          "  buyShip(buyShip)",
          "  subgraph harbor",
          "    _or_startJourney{Or}:::logicOr",
          "    startJourney(startJourney)",
          "  end",
          "  class harbor group",
          `  classDef chapter ${styleToMermaidString(CHAPTER_STYLE)}`,
          `  classDef logicOr ${styleToMermaidString(LOGIC_OR_STYLE)}`,
          `  classDef group ${styleToMermaidString(GROUP_STYLE)}`,
          "  _start --> threeTrials",
          "  _start --> buyShip",
          "  buyShip -.-> _or_startJourney",
          "  threeTrials -.-> _or_startJourney",
          "  _or_startJourney --> startJourney",
        ]);
      });
    });
  });
});
