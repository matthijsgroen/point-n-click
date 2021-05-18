export type Doll = ImageStackDoll | GeppettoDoll;
export type DollType = Doll["type"];

type ImageStackDoll = {
  name: string;
  size: [number, number];
  type: "imagestack";
  layers: string[];
  images: Record<string, Record<string, string>>;
};

type GeppettoDoll = {
  name: string;
  type: "geppetto";
};
