import { GameWorld, MapDirection, WorldMap } from "@point-n-click/types";

const thinArrows: MapDirection[] = ["contains", "parent"];

export const mapToMermaid = <Map extends WorldMap<GameWorld>>(
  map: Map,
  options?: Record<string, boolean>
): string => {
  const characters: string[] = [];
  const locations: string[] = [];

  for (const item in map.locations) {
    const location = map.locations[item];
    if (!location) continue;

    for (const connection in location.connections) {
      const connected = location.connections[connection];
      if (!connected) continue;
      const thinArrow = thinArrows.includes(connected.direction);

      const items = [item, connection].sort((a, b) => a.localeCompare(b));

      const arrow =
        connected.direction === "teleport" ? "-.-" : thinArrow ? "---" : "===";
      locations.push(`  ${items[0]} ${arrow} ${items[1]}`);
    }
    for (const charName in location.characters) {
      characters.push(charName);
      locations.push(`  ${charName} -.-> ${item}`);
    }
  }

  return ["flowchart", ...characters.map((c) => `  ${c}([${c}])`), ...locations]
    .filter((line, idx, list) => list.indexOf(line) === idx)
    .join("\n");
};
