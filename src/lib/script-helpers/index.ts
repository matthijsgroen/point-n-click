import { Slice, SliceCaseReducers } from "@reduxjs/toolkit";
import { Queue } from "../../lib/queue";
import { stateHelpers } from "./state";

const scriptHelpers =
  <
    GameState,
    Reducers extends SliceCaseReducers<GameState>,
    Name extends string
  >(
    slice: Slice<GameState, Reducers, Name>
  ) =>
  (q: Queue) => {
    return {
      fadeIn() {
        q.addItem({ type: "screenEffect", effect: "fadeIn" });
      },
      say(text: string) {
        q.addItem({ type: "dialog", text });
      },
      ...stateHelpers(slice, q),
    };
  };

export default scriptHelpers;
