import { DisplayErrorText, GameWorld } from "@point-n-click/types";
import { parseText } from "../text/processText";
import { FormattedText } from "../text/types";

export const noOverlay = <Game extends GameWorld>(
  overlayId: keyof Game["overlays"] | undefined
): DisplayErrorText => ({
  type: "error",
  message: [
    parseText(
      `Overlay data for overlay {b}${String(overlayId)}{/b} not found.`
    ) as FormattedText,
    parseText(
      "Create a new overlay with {i}.defineOverlay{/i}. And make sure the file is {b}imported{/b}."
    ) as FormattedText,
  ],
});
