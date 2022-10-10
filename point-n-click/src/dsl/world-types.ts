import { StateCondition } from "./ast-types";

export type WorldObjectSettings = {
  states?: unknown;
  flags?: unknown;
  values?: unknown;
  counters?: unknown;
};

export type GameWorld = {
  locations: Record<string, WorldObjectSettings>;
  characters: Record<string, WorldObjectSettings>;
  items: Record<string, WorldObjectSettings>;
  overlays: unknown;
};

export type Script = () => void;

export type LocationScript<
  Game extends GameWorld,
  Location extends keyof Game["locations"]
> = (events: {
  onEnter: (
    from: Exclude<keyof Game["locations"], Location>,
    script: Script
  ) => void;
  onLeave: (
    from: Exclude<keyof Game["locations"], Location>,
    script: Script
  ) => void;
  describe: (script: () => void) => void;
  interaction: Interaction<Game>;
}) => void;

export type OverlayScript<Game extends GameWorld> = (events: {
  onEnter: (script: Script) => void;
  onLeave: (script: Script) => void;
  interaction: Interaction<Game>;
  closeOverlay: () => void;
}) => void;

export type EvaluateCondition<Game extends GameWorld> = (
  condition: StateCondition<Game>,
  script: Script,
  elseScript?: Script
) => void;

export type Interaction<Game extends GameWorld> = (
  text: string,
  condition: StateCondition<Game>,
  script: Script
) => void;
