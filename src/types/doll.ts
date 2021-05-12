export type DollType = "imagestack" | "geppetto";

export type Doll = {
  name: string;
  size: [number, number];
  type: DollType;
  layers: string[];
  images: Record<string, Record<string, string>>;
};
