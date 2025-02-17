import { ContentPlugin, DSLExtension, world } from "@point-n-click/engine";
import { GameState } from "./stateModelV1";

export const plugins = [] as const satisfies ContentPlugin<
  string,
  DSLExtension
>[];

const game = world<GameState, typeof plugins>(
  {
    gameTitle: "Hiddo redt het Sinterklaasfeest",
    meta: {
      author: "Matthijs Groen",
      // credits: [
      //   { role: "Story & Writing", names: ["Matthijs Groen"] },
      //   { role: "Programming", names: ["Matthijs Groen"] },
      //   {
      //     role: "Play testing",
      //     names: ["Matthijs Groen", "Hiddo Groen", "Jinte Groen"],
      //   },
      // ],
    },
    initialState: {
      version: 1,
      currentLocation: "home",
      characters: {
        player: {
          name: "Hiddo",
        },
        jinte: {
          name: "Jinte",
        },
        rhyhmePete: {
          name: "Rijmpiet",
        },
        bakePete: {
          name: "Bakpiet",
        },
        headPete: {
          name: "Hoofdpiet",
        },
        reporter: {
          name: "Verslaggever",
        },
        stNicolas: {
          name: "Sinterklaas",
        },
      },
      locations: {
        home: { name: "Thuis" },
        lawn: { name: "Tuin" },
        hallway: { name: "Hal" },
        kitchen: { name: "Keuken" },
        livingRoom: { name: "Woonkamer" },
        studyOfSaintNicolas: { name: "Werkkamer van Sinterklaas" },
        studyOfRhymhePete: { name: "Werkkamer van Rijmpiet" },
      },
      items: {},
    },
  },
  plugins
);

export default game;
