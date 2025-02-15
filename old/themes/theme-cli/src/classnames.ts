export const classNames = (classNames: Record<string, boolean>): string =>
  Object.entries(classNames)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(" ");
