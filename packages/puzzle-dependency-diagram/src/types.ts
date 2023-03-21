export type BasePuzzleEventStates = Record<string, string>;

export type PuzzleEvent<
  PuzzleEventStates extends BasePuzzleEventStates = {},
  ValidDependencies extends string = string
> = {
  name?: string;
  dependsOn?: ValidDependencies[];
  type?: "puzzle" | "task" | "chapter";
  tags?: {
    [Key in keyof PuzzleEventStates]?: PuzzleEventStates[Key];
  };
};

export type PuzzleDependencyDiagram<
  PuzzleEventStates extends BasePuzzleEventStates = {},
  EventKey extends string = string
> = Record<EventKey, PuzzleEvent<PuzzleEventStates, EventKey>>;

export type ValidationError = {
  message: string;
};
