export type PuzzleEvent<
  PuzzleEventStates extends string,
  ValidDependencies extends string = string
> = {
  name?: string;
  dependsOn?: ValidDependencies[];
  status?: PuzzleEventStates;
  type?: "puzzle" | "task";
};

export type EventStyle = {
  color: `#${string}`;
};

export type PuzzleDependencyDiagram<
  PuzzleEventStates extends string = never,
  EventKey extends string = string
> = {
  events: Record<EventKey, PuzzleEvent<PuzzleEventStates, EventKey>>;
  styles?: {
    [Key in PuzzleEventStates]?: EventStyle;
  };
};

export type ValidationError = {
  message: string;
};
