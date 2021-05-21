export type Doll<T> = ImageStackDoll<T> | GeppettoDoll;
export type DollType = Doll<Record<string, string>>["type"];

type ImageStackDoll<T extends Record<string, string>> = {
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
