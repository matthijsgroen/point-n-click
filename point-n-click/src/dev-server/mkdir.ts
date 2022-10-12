import { mkdir as fsMkdir } from "fs/promises";

export const mkdir = async (folder: string) => {
  try {
    await fsMkdir(folder, { recursive: true });
  } catch (e) {
    if (
      "code" in (e as Error) &&
      (e as Error & { code: string }).code === "EEXIST"
    ) {
      // no problem
    } else {
      throw e;
    }
  }
};
