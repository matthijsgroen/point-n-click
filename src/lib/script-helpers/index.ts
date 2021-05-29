import { Queue } from "../../types/queue";

const scriptHelpers = <GameState>(q: Queue) => {
  return {
    fadeIn() {},
    onState(
      condition: (state: GameState) => boolean,
      whenTrue: (q: Queue) => void,
      whenFalse?: (q: Queue) => void
    ) {},
  };
};

export default scriptHelpers;
