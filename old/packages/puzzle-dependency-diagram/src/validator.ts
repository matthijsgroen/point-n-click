import { PuzzleDependencyDiagram, ValidationError } from "./types";

export const validateDiagram = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const knownEvents = Object.keys(diagram);
  for (const event of knownEvents) {
    const dependencies = diagram[event].dependsOn;
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!knownEvents.includes(dependency)) {
          errors.push({
            message: `event '${event}' dependency '${dependency}' is not defined.`,
          });
        }
      }
    }
  }
  return errors;
};
