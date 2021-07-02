import { MaybePromise } from "../../types/generic";

const times = (x: number) => async (f: () => MaybePromise<unknown>) => {
  if (x > 0) {
    await f();
    await times(x - 1)(f);
  }
};

export default times;
