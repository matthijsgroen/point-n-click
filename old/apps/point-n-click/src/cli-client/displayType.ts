let viewKey: string = "";

/**
 * Marks the listing of a certain type of content: like a character speaking, or narration text.
 * By updating the type and you change from one type to another, you can add a separator in the screen
 * (like an extra empty line)
 */
export const setDisplayType = async (
  key: string,
  callback: () => Promise<void> | void
) => {
  if (key === viewKey) return;
  if (viewKey !== key && viewKey !== "") {
    await callback();
  }
  viewKey = key;
};

export const resetDisplayType = () => {
  viewKey = "";
};
