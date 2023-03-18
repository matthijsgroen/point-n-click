import * as state from "@point-n-click/state";
export type { PuzzleDependencyDiagram } from "@point-n-click/puzzle-dependency-diagram";

export { world } from "./dsl/dsl";
export type { GameDefinition } from "./dsl/dsl";
export { cli } from "./cli";

export const hexColor = state.hexColor;
export const createColorPalette = state.createColorPalette;
