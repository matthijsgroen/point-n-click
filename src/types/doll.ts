type ImageMap = Record<string, string>;
export type Doll<T extends ImageMap> = ImageStackDoll<T> | GeppettoDoll;
export type DollType = Doll<Record<string, string>>["type"];

type ImageStackDoll<T extends ImageMap> = {
  name: string;
  size: [number, number];
  type: "imagestack";
  layers: string[];
  images: { [Property in keyof T]: Record<T[Property], string> };
};

type GeppettoDoll = {
  name: string;
  type: "geppetto";
};
