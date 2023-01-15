import { Brand, HexColor } from "./hexColor";

export type PaletteColor = Brand<string, "PaletteColor">;
export type ColorPalette = Record<PaletteColor, HexColor>;

export const createColorPalette = <T extends string>(_colors: T[]) => ({
  color: (choice: T): PaletteColor => choice as string as PaletteColor,
  defineColorScheme: (palette: { [P in T]: HexColor }): ColorPalette => palette,
});
