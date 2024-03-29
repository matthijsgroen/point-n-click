import { DisplayErrorText, GameWorld } from "@point-n-click/types";
import { parseText } from "../text/processText";
import { FormattedText } from "../text/types";

export const noLocation = <Game extends GameWorld>(
  locationId: keyof Game["locations"] | undefined
): DisplayErrorText => ({
  type: "error",
  message: [
    parseText(
      `Location data for location {b}${String(locationId)}{/b} not found.`
    ) as FormattedText,
    parseText(
      "Create a new location with {i}.defineLocation{/i}. And make sure the file is {b}imported{/b}."
    ) as FormattedText,
  ],
});
