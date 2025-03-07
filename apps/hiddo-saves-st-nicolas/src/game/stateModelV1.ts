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
          head: "thinking" | "happy" | "shocked";
          body: "normal" | "thinking";
        };
        flags: "hasGlasses";
        poses: "normal" | "thinking" | "shocked";
      };
      pete: {
        states: {
          body: "headPete" | "bakePete" | "rhymePete";
          head: "enthusiast" | "smile" | "talk" | "cry" | "sad" | "down";
        };
        flags: "hasFingerUp";
      };
      background: {
        states: {
          image:
            | "hallway"
            | "kitchen"
            | "livingRoom"
            | "studyOfSaintNicolas"
            | "studyOfRhymhePete";
        };
      };
      lawn: {
        states: { image: "lawn" };
      };
      newsOverlay: {
        states: { overlay: "begin" | "end" };
      };
      home: {
        states: { image: "home" };
        flags: "hasKidsOnCouch" | "isTVOn";
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
