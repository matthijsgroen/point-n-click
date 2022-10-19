type Settings<T extends Record<string, unknown>> = {
  get: () => T;
  update: (update: Partial<T>) => void;
};

export const settings = <T extends Record<string, unknown>>(
  initialSettings: T
): Settings<T> => {
  let settings: T = initialSettings;

  return {
    get: () => settings,
    update: (updates) => {
      settings = { ...settings, ...updates };
    },
  };
};
