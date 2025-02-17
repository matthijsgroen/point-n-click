import { GameDefinition } from "@point-n-click/engine";

export type GameState = GameDefinition<
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
  }
>;
