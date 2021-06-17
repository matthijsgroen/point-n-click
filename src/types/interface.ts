export type Button = {
  id: string;
  image: string;
  position: [number, number];
  scale?: number;
  visible?: boolean;
  hoverEffect?: "glow" | "shadow";
  role?: "hud";
};

export type Highlight = {
  id: string;
  coordinates: number[];
  color?: string;
  visible?: boolean;
  hoverEffect?: "glow";
};
