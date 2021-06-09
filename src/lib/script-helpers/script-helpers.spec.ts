import scriptHelpers from "./";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import queue, { Queue, QueueProcessor } from "../queue";
import messageBus from "../messageBus";
import times from "../test-helpers/times";
import { stateSystem } from "./state";

type GameState = {
  dayPart: "morning" | "evening";
  day: number;
};

const slice = createSlice({
  name: "game",
  initialState: {
    dayPart: "morning",
    day: 10,
  } as GameState,
  reducers: {
    timePasses(state) {
      if (state.dayPart === "morning") {
        state.dayPart = "evening";
      } else {
        state.dayPart = "morning";
        state.day++;
      }
    },
  },
});

const store = configureStore({ reducer: { gameState: slice.reducer } });

const helpers = scriptHelpers(slice);
const stateSys = stateSystem(store);

type DialogEvent = {
  type: "dialog";
  text: string;
};

describe("state helpers", () => {
  describe("onState", () => {
    it("works with a redux state slice", async () => {
      const script = (q: Queue) => {
        const { onState, say } = helpers(q);

        onState(
          (s) => s.day % 7 === 3,
          () => {
            say("It is wednesday");
          }
        );
      };

      const bus = messageBus();
      const q = queue(bus);
      q.addProcessor(stateSys.stateProcessor);

      script(q);

      const send: string[] = [];

      const dialogProcessor: QueueProcessor<DialogEvent> = {
        type: "dialog",
        handle(item) {
          send.push(item.text);
        },
      };
      q.addProcessor(dialogProcessor);

      bus.listen("out:dialog", () =>
        setTimeout(() => bus.trigger({ type: "in:dialog:done" }), 1)
      );

      // don't execute last step
      await times(2)(() => q.processItem());

      expect(send).toEqual(["It is wednesday"]);
    });
  });

  describe("updateState", () => {
    it("works with a redux state slice", async () => {
      const script = (q: Queue) => {
        const { updateState } = helpers(q);

        updateState((a) => a.timePasses());

        updateState((a) => a.timePasses());
      };

      const bus = messageBus();
      const q = queue(bus);
      q.addProcessor(stateSys.stateProcessor);

      script(q);
      await q.processItem();

      expect(store.getState().gameState.day).toEqual(10);
      expect(store.getState().gameState.dayPart).toEqual("evening");

      await q.processItem();

      expect(store.getState().gameState.day).toEqual(11);
      expect(store.getState().gameState.dayPart).toEqual("morning");
    });
  });
});
