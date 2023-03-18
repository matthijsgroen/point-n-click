import * as state from "@point-n-click/state";
export type { PuzzleDependencyDiagram } from "../../puzzle-dependency-diagram/dist";

export { world } from "./dsl/dsl";
export type { GameDefinition } from "./dsl/dsl";
export { cli } from "./cli";

export const hexColor = state.hexColor;
export const createColorPalette = state.createColorPalette;
