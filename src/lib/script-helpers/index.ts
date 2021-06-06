import { Queue } from "../../lib/queue";

const scriptHelpers = <GameState>(q: Queue) => {
  return {
    fadeIn() {
      q.addItem({ type: "screenEffect", effect: "fadeIn" });
    },
    say(text: string) {
      q.addItem({ type: "dialog", text });
    },
    onState(
      condition: (state: GameState) => boolean,
      whenTrue: () => void,
      whenFalse?: () => void
    ) {
      q.addItem({
        type: "gameState",
        flowType: "choice",
        condition,
        whenTrue,
        whenFalse,
      });
    },
  };
};

export default scriptHelpers;
