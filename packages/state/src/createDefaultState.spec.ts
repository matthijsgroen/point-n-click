import { GameWorld } from "@point-n-click/types";
import { createDefaultState } from "./createDefaultState";

type GameDefinition<
  Version extends number,
  Game extends GameWorld<Version>
> = Game;

type TestGameWorld = GameDefinition<
  1,
  {
    version: 1;
    locations: {
      cabin: {};
      forest: {};
    };
    characters: {
      redRidingHood: {
        states: "eaten" | "bringing cookies";
        counters: "cookies";
      };
      wolf: {
        states: "in bed" | "dead";
      };
    };
    items: {};
    overlays: {};
  }
>;

describe("createDefaultState", () => {
  describe("game characters", () => {
    it("generates a complete state for a state definition", () => {
      const result = createDefaultState<TestGameWorld>({
        settings: {
          gameTitle: "Red riding hood",
          locales: { default: "de-DE", supported: { "de-DE": "German" } },
          initialState: {},
          colors: {
            lightPalette: {},
            darkPalette: {},
          },
          characterConfigs: {
            redRidingHood: {
              defaultName: "Red riding hood",
            },
            wolf: {
              defaultName: "Wolf",
            },
          },
        },
        locations: [],
        overlays: [],
        globalInteractions: [],
        themes: [],
      });

      expect(result.characters).toEqual({
        redRidingHood: {
          counters: {},
          defaultName: "Red riding hood",
          flags: {},
          name: null,
          state: "unknown",
        },
        wolf: {
          counters: {},
          defaultName: "Wolf",
          flags: {},
          name: null,
          state: "unknown",
        },
      });
    });

    it("merges the initial state into the character", () => {
      const result = createDefaultState<TestGameWorld>({
        settings: {
          gameTitle: "Red riding hood",
          locales: { default: "de-DE", supported: { "de-DE": "German" } },
          initialState: {
            characters: {
              redRidingHood: {
                counters: {
                  cookies: 5,
                },
              },
              wolf: {
                state: "in bed",
              },
            },
          },
          colors: {
            lightPalette: {},
            darkPalette: {},
          },
          characterConfigs: {
            redRidingHood: {
              defaultName: "Red riding hood",
            },
            wolf: {
              defaultName: "Wolf",
            },
          },
        },
        locations: [],
        overlays: [],
        globalInteractions: [],
        themes: [],
      });

      expect(result.characters).toEqual({
        redRidingHood: {
          counters: { cookies: 5 },
          defaultName: "Red riding hood",
          flags: {},
          name: null,
          state: "unknown",
        },
        wolf: {
          counters: {},
          defaultName: "Wolf",
          flags: {},
          name: null,
          state: "in bed",
        },
      });
    });
  });
});
