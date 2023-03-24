export type BasePuzzleEventStates = Record<string, string>;

export type PuzzleEvent<PuzzleEventStates extends BasePuzzleEventStates = {}> =
  {
    /**
     * Human readable name for this puzzle event
     */
    name?: string;
    /**
     * List of puzzles that must be solved first
     */
    dependsOn?: string[];
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
      [Key in keyof PuzzleEventStates]?:
        | PuzzleEventStates[Key]
        | PuzzleEventStates[Key][];
    };
    /**
     * Visual hierarchy of the puzzle node.
     * For instance: Melee Island, Scumm Bar, Cook
     */
    hierarchy?: string[];
  };

export type PuzzleDependencyDiagram<
  PuzzleEventStates extends BasePuzzleEventStates = {},
  EventKey extends string = string
> = Record<EventKey, PuzzleEvent<PuzzleEventStates>>;

export type ValidationError = {
  message: string;
};
