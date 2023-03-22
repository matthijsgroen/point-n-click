export type BasePuzzleEventStates = Record<string, string>;

export type PuzzleEvent<
  PuzzleEventStates extends BasePuzzleEventStates = {},
  ValidDependencies extends string = string
> = {
  /**
   * Human readable name for this puzzle event
   */
  name?: string;
  /**
   * List of puzzles that must be solved first
   */
  dependsOn?: ValidDependencies[];
  /**
   * Must all dependencies be solved or only one.
   * @default "and"
   */
  dependencyType?: "and" | "or";
  /**
   * Type of puzzle
   * - Task means a repeatable puzzle
   * - Puzzle is one time
   * - Chapter indicates next part in story narrative
   *
   * @default "puzzle"
   */
  type?: "puzzle" | "task" | "chapter";
  /**
   * Tags for filtering
   */
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
