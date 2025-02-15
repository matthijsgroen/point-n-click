import {
  GameModel,
  GameWorld,
  OpenGameOverlay,
  TravelStatement,
} from "@point-n-click/types";
import { ValidationMessage } from "./ValidationMessage";
import { traverse } from "./traverse";

export const validateJumpPoints = async (
  model: GameModel<GameWorld>
): Promise<ValidationMessage[]> => {
  const report: ValidationMessage[] = [];
  const definedLocations = model.locations.map((l) => l.id);
  const definedOverlays = model.overlays.map((l) => l.id);

  const doubleLocationDefinitions = definedLocations.filter(
    (loc, i, list) => list.indexOf(loc) !== i
  );

  doubleLocationDefinitions.forEach((location) => {
    report.push({
      message: `"${location}" has been defined multiple times.`,
      messageType: "error",
      location: [
        { type: "key", value: "location" },
        { type: "key", value: location },
      ],
      source: "validateJumps",
    });
  });

  const doubleOverlayDefinitions = definedOverlays.filter(
    (overlay, i, list) => list.indexOf(overlay) !== i
  );

  doubleOverlayDefinitions.forEach((overlay) => {
    report.push({
      message: `"${overlay}" has been defined multiple times.`,
      messageType: "error",
      location: [
        { type: "key", value: "overlay" },
        { type: "key", value: overlay },
      ],
      source: "validateJumps",
    });
  });

  const locationsUsed: string[] = [];
  const overlaysUsed: string[] = [];
  const startLocation = model.settings.initialState.currentLocation;
  if (startLocation) {
    locationsUsed.push(startLocation);
  }

  traverse(model, (path, item) => {
    if (item.statementType === "Travel") {
      const destination = (item as TravelStatement<GameWorld>)
        .destination as string;
      locationsUsed.push(destination);

      if (!definedLocations.includes(destination)) {
        report.push({
          message: `Travel destination "${destination}" is not defined.`,
          messageType: "error",
          location: path.map((value) => ({ type: "key", value })),
          source: "validateJumps",
        });
      }
    }
    if (item.statementType === "OpenOverlay") {
      const destination = (item as OpenGameOverlay<GameWorld>)
        .overlayId as string;
      overlaysUsed.push(destination);
      if (!definedOverlays.includes(destination)) {
        report.push({
          message: `Overlay "${destination}" is not defined.`,
          messageType: "error",
          location: path.map((value) => ({ type: "key", value })),
          source: "validateJumps",
        });
      }
    }
  });

  const unusedLocations = definedLocations.filter(
    (loc) => !locationsUsed.includes(loc)
  );
  unusedLocations.forEach((location) => {
    report.push({
      message: `"${location}" has been defined but is not used.`,
      messageType: "warning",
      location: [
        { type: "key", value: "location" },
        { type: "key", value: location },
      ],
      source: "validateJumps",
    });
  });

  const unusedOverlays = definedOverlays.filter(
    (overlay) => !overlaysUsed.includes(overlay)
  );
  unusedOverlays.forEach((overlay) => {
    report.push({
      message: `"${overlay}" has been defined but is not used.`,
      messageType: "warning",
      location: [
        { type: "key", value: "overlay" },
        { type: "key", value: overlay },
      ],
      source: "validateJumps",
    });
  });

  return report;
};
