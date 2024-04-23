import React, { CSSProperties } from "react";
import clsx from "clsx";
import styles from "./MapLayoutView.module.css";
import { GameWorld, MapDirection, WorldMap } from "@point-n-click/types";

type AreaExit = "s" | "e" | "sw";

type MapArea = {
  name: string;
  pos: [x: number, y: number];
  connections?: AreaExit[];
  linksTo?: string[];
};

type MapGrid = {
  name: string;
  areas: MapArea[];
};

const sameMap: MapDirection[] = [
  "north",
  "northeast",
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
];

const isSameMap = (direction: MapDirection): boolean =>
  sameMap.includes(direction);

const getPos = <T extends GameWorld>(
  locationName: keyof T["locations"],
  map: MapGrid
): [x: number, y: number] | undefined =>
  map?.areas.find((area) => area.name === locationName)?.pos;

const getMapIndex = <T extends GameWorld>(
  locationName: keyof T["locations"],
  maps: MapGrid[]
): number =>
  maps.findIndex((map) =>
    map?.areas.find((area) => area.name === locationName)
  );

const getShift = (map: MapGrid): [x: number, y: number] => {
  let lowestX = Infinity;
  let lowestY = Infinity;

  for (const area of map.areas) {
    if (area.pos[0] < lowestX) {
      lowestX = area.pos[0];
    }
    if (area.pos[1] < lowestY) {
      lowestY = area.pos[1];
    }
  }

  return [lowestX < 1 ? 1 - lowestX : 0, lowestY < 1 ? 1 - lowestY : 0];
};

const getMapSize = (map: MapGrid): [x: number, y: number] => {
  let highestX = 1;
  let highestY = 1;

  for (const area of map.areas) {
    if (area.pos[0] > highestX) {
      highestX = area.pos[0];
    }
    if (area.pos[1] > highestY) {
      highestY = area.pos[1];
    }
  }

  return [highestX, highestY];
};

const createPos = (
  pos: [x: number, y: number],
  direction: MapDirection
): [x: number, y: number] => {
  const deltas: Record<MapDirection, [x: number, y: number]> = {
    contains: [0, 0],
    east: [1, 0],
    "floor-down": [0, 0],
    "floor-up": [0, 0],
    north: [0, -1],
    northeast: [1, -1],
    northwest: [-1, -1],
    parent: [0, 0],
    south: [0, 1],
    southeast: [1, 1],
    southwest: [-1, 1],
    teleport: [0, 0],
    west: [-1, 0],
  };
  const delta = deltas[direction];
  return [pos[0] + delta[0], pos[1] + delta[1]];
};

const buildMaps = <T extends GameWorld>(worldMap: WorldMap<T>): MapGrid[] => {
  const maps: MapGrid[] = [
    {
      name: "Start",
      areas: [
        {
          name: worldMap.start.toString(),
          pos: [1, 1],
        },
      ],
    },
  ];

  const addItemConnectionsToMap = (locationName: keyof T["locations"]) => {
    const location = worldMap.locations[locationName];
    const inMap = getMapIndex(locationName, maps);
    if (inMap === -1) return;

    const source = maps[inMap].areas.find((area) => area.name === locationName);
    if (!source) return;
    const pos = getPos(locationName, maps[inMap]);

    const nextTargets: string[] = [];

    Object.entries(location?.connections ?? {}).forEach(
      ([target, connection]) => {
        if (!connection) return;
        const targetMap = getMapIndex(target, maps);
        const direction = connection.direction;

        const onSameMap = isSameMap(direction);

        if (onSameMap) {
          if (direction === "south") {
            source.connections = source?.connections ?? [];
            source.connections.push("s");
          }
          if (direction === "east") {
            source.connections = source?.connections ?? [];
            source.connections.push("e");
          }
          if (direction === "southwest") {
            source.connections = source?.connections ?? [];
            source.connections.push("sw");
          }
        }

        if (targetMap !== -1) {
          if (!onSameMap) {
            source.linksTo = source?.linksTo ?? [];
            if (!source.linksTo.includes(target)) {
              source.linksTo.push(target);
            }
          }
          return;
        }

        if (onSameMap && pos) {
          const newPosition = createPos(pos, direction);

          maps[inMap].areas.push({
            name: target,
            pos: newPosition,
          });
        } else {
          if (source) {
            source.linksTo = source?.linksTo ?? [];
            source.linksTo.push(target);
          }

          maps.push({
            name: target,
            areas: [
              {
                name: target,
                pos: [1, 1],
              },
            ],
          });
        }

        nextTargets.push(target);
      }
    );

    for (const target of nextTargets) {
      addItemConnectionsToMap(target);
    }
  };

  addItemConnectionsToMap(worldMap.start);

  for (const map of maps) {
    const shift = getShift(map);
    for (const area of map.areas) {
      area.pos = [area.pos[0] + shift[0], area.pos[1] + shift[1]];
    }
  }

  return maps;
};

export const MapLayoutView: React.FC<{
  map: WorldMap<GameWorld>;
}> = ({ map }) => {
  const maps = buildMaps(map);

  return (
    <div>
      <h1>Maps</h1>
      {maps.map((m, mi) => {
        const size = getMapSize(m);
        return (
          <div
            className={styles.map}
            data-title={m.name}
            key={mi}
            style={
              {
                ["--mapX"]: size[0],
                ["--mapY"]: size[1],
              } as CSSProperties
            }
          >
            {m.areas.map((area, ai) => {
              const characters = Object.values(
                map.locations[area.name]?.characters ?? {}
              ).length;
              return (
                <React.Fragment key={ai}>
                  <div
                    className={styles.location}
                    style={{ gridRow: area.pos[1], gridColumn: area.pos[0] }}
                  >
                    {area.name}
                    <br />
                    {area.linksTo !== undefined && `⏺️ ${area.linksTo.length} `}
                    {characters > 0 && `🚻 ${characters} `}
                  </div>
                  {area.connections &&
                    area.connections.map((connection) => (
                      <div
                        className={clsx({
                          [styles.e]: connection === "e",
                          [styles.s]: connection === "s",
                          [styles.sw]: connection === "sw",
                        })}
                        style={{
                          gridRow: area.pos[1],
                          gridColumn: area.pos[0],
                        }}
                      ></div>
                    ))}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
