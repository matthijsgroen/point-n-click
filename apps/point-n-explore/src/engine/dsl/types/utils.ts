export type RecursivePartial<T extends Record<string, unknown>> = {
  [Key in keyof T]?: T[Key] extends Record<string, unknown>
    ? RecursivePartial<T[Key]>
    : T[Key];
};

export type RecursiveWritablePartial<T extends Record<string, unknown>> = {
  -readonly [Key in keyof T]?: T[Key] extends Record<string, unknown>
    ? RecursiveWritablePartial<T[Key]>
    : T[Key];
};

export type RecursiveReadOnly<T extends Record<string, unknown>> = {
  readonly [Key in keyof T]: T[Key] extends Record<string, unknown>
    ? RecursiveReadOnly<T[Key]>
    : T[Key];
};
