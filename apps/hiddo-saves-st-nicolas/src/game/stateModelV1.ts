import {
  GameStateDefinition,
  GameSettingsDefinition,
} from "@point-n-click/engine";

export type GameState = GameStateDefinition<
  1,
  {
    version: 1;
    locations: {
      home: {};
      lawn: {};
      hallway: {};
      kitchen: {};
      livingRoom: {};
      studyOfSaintNicolas: {};
      studyOfRhymhePete: {};
    };
    items: {};
    characters: {
      player: {};
      jinte: {};
      rhyhmePete: {};
      stNicolas: {};
      bakePete: {};
      headPete: {};
      reporter: {};
    };
    overlays: {};
    lists: {};
    scenes: "tvIntro";
    displayObjects: {
      hiddo: {
        states: {
          head: "thinking" | "happy";
          body: "normal" | "thinking";
        };
        flags: "hasGlasses";
        poses: "normal" | "thinking";
      };
    };
  }
>;

export type GameSettings = GameSettingsDefinition<
  1,
  {
    version: 1;
    timePlayed: number;
    backgroundVolume: number;
    soundVolume: number;
  }
>;
