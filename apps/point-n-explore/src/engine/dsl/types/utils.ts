export type RecursivePartial<T extends Record<string, unknown>> = {
    [Key in keyof T]?: T[Key] extends Record<string, unknown> ? RecursivePartial<T[Key]> : T[Key];
};