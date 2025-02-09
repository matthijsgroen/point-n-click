// import {  world } from "point-n-click";
// import terminalTheme from "@point-n-click/theme-cli";
// import bookTheme from "@point-n-click/theme-book";
import { world } from "../engine/dsl/syntax/world";
import { GameState } from "./stateModelV1";

// const palette = createColorPalette([
//   "default",
//   "player",
//   "baker",
//   "miller",
//   "dwarf",
//   "horse",
//   "dragon",
//   "farmer",
//   "daughter",
//   "witch",
//   "farrier",
//   "goldsmith",
//   "armorer",
//   "villager",
//   "forging",
//   "pain",
// ]);

// const darkColors = palette.defineColorScheme({
//   default: hexColor("118111"),
//   player: hexColor("9999ff"),
//   dwarf: hexColor("565cfb"),
//   miller: hexColor("565cfb"),
//   horse: hexColor("ee4040"),
//   dragon: hexColor("cc40cc"),
//   farmer: hexColor("30cc30"),
//   baker: hexColor("565cfb"),
//   daughter: hexColor("30cc30"),
//   witch: hexColor("cc30cc"),
//   farrier: hexColor("e0e3d7"),
//   goldsmith: hexColor("ffd700"),
//   armorer: hexColor("2879C0"),
//   villager: hexColor("ee4040"),
//   forging: hexColor("20ff00"),
//   pain: hexColor("cc0000"),
// });

// const lightColors = palette.defineColorScheme({
//   default: hexColor("18181b"),
//   player: hexColor("1aaaa9"),
//   dwarf: hexColor("565cfb"),
//   miller: hexColor("565cfb"),
//   horse: hexColor("ee4040"),
//   dragon: hexColor("cc40cc"),
//   farmer: hexColor("30cc30"),
//   baker: hexColor("565cfb"),
//   daughter: hexColor("ff3030"),
//   witch: hexColor("cc30cc"),
//   farrier: hexColor("30cc30"),
//   goldsmith: hexColor("806C00"),
//   armorer: hexColor("2879C0"),
//   villager: hexColor("ee4040"),
//   forging: hexColor("909000"),
//   pain: hexColor("400000"),
// });

const game = world<GameState>({
  gameTitle: "Courier for the king",
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
  // locales: {
  //   default: "en-US",
  //   supported: {
  //     ["en-US"]: "English",
  //     ["nl-NL"]: "Nederlands",
  //   },
  // },
  // colors: {
  //   lightPalette: lightColors,
  //   darkPalette: darkColors,
  //   defaultTextColor: palette.color("default"),
  // },
  initialState: {
    version: 1,
    currentLocation: "home",
    characters: {
      player: {
        flags: {
          isMale: true,
        },
      },
    },
  },
  characterConfigs: {
    player: {
      defaultName: "Matthijs",
      // textColor: palette.color("player"),
    },
    dwarf: {
      defaultName: "Thorin",
      // textColor: palette.color("dwarf"),
    },
    miller: {
      defaultName: "Smock",
      // textColor: palette.color("miller"),
    },
    horse: {
      defaultName: "Teun",
      // textColor: palette.color("horse"),
    },
    dragon: {
      defaultName: "Dins",
      // textColor: palette.color("dragon"),
    },
    farmer: {
      defaultName: "Piedmont",
      // textColor: palette.color("farmer"),
    },
    baker: {
      defaultName: "Barley",
      // textColor: palette.color("baker"),
    },
    daughter: {
      defaultName: "Flower",
      // textColor: palette.color("daughter"),
    },
    witch: {
      defaultName: "Eucalypta",
      // textColor: palette.color("witch"),
    },
    farrier: {
      defaultName: "Luk",
      // textColor: palette.color("farrier"),
    },
    goldsmith: {
      defaultName: "Luuk",
      // textColor: palette.color("goldsmith"),
    },
    armorer: {
      defaultName: "Lucy",
      // textColor: palette.color("armorer"),
    },
    villager: {
      defaultName: "Villager",
      // textColor: palette.color("villager"),
    },
  },
});

export default game;
