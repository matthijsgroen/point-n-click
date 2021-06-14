import scriptHelpers from "../lib/script-helpers";
import { Script } from "./script";
import queue, { QueueProcessor, Queue } from "../lib/queue";
import messageBus, { MessageBus, Event, Listener } from "../lib/messageBus";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { stateSystem } from "../lib/script-helpers/state";

type GameState = {
  dayPart: "morning" | "evening";
  day: number;
};

const slice = createSlice({
  name: "game",
  initialState: {
    dayPart: "morning",
    day: 1,
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

const store = configureStore({
  reducer: {
    gameState: slice.reducer,
  },
});

const helpers = scriptHelpers(slice);

describe("Script", () => {
  let q: Queue;
  let bus: MessageBus;

  beforeEach(() => {
    bus = messageBus();
    q = queue(bus);
  });

  it("builds a queue on execution", () => {
    const testScript: Script = (q) => {
      const { fadeIn, onState, say } = helpers(q);

      fadeIn();

      onState(
        (s) => s.dayPart === "morning",
        () => {
          say("Good morning");
        },
        () => {
          say("Good evening!");
        }
      );
      say("How are you?");
    };
    testScript(q);

    expect(q).toHaveLength(3); // contents in 'onState' is not unfolded
  });

  describe("queue processing", () => {
    type ScreenEffect = {
      type: "screenEffect";
      effect: string;
    };

    const screenProcessor: QueueProcessor<ScreenEffect> = {
      type: "screenEffect",
      handle(item, { trigger }) {
        trigger({ type: "out:screen:effect", effect: item.effect });
      },
    };

    type DialogEvent = {
      type: "dialog";
      text: string;
    };

    const dialogProcessor: QueueProcessor<DialogEvent> = {
      type: "dialog",
      async handle(item, { request }) {
        await request("out:dialog", item.text);
      },
    };

    beforeEach(() => {
      const stateManager = stateSystem(store);

      q.addProcessor(screenProcessor);
      q.addProcessor(dialogProcessor);
      q.addProcessor(stateManager.stateProcessor);
    });

    it("delegates work to registered processors", async () => {
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, say } = helpers(q);

        fadeIn();
        say("How are you?");
      };

      testScript(q);

      bus.listen("out:*", (event) => send.push(event));
      bus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      while (q.length > 0) {
        await q.processItem();
      }

      expect(q.processLog).toEqual([
        {
          type: "out:dialog",
          direction: "request",
          payload: "How are you?",
          queueItem: { text: "How are you?", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "How are you?",
          queueItem: { text: "How are you?", type: "dialog" },
        },
      ]);
    });

    it("unfolds tasks during execution", async () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = helpers(q);

        fadeIn();

        onState(
          (s) => s.dayPart === "morning",
          () => {
            say("Good morning");
          },
          () => {
            say("Good evening!");
          }
        );
        say("How are you?");
      };

      testScript(q);

      bus.listen("out:*", (event) => send.push(event));
      bus.listen("in:*", (event) => received.push(event));
      bus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      while (q.length > 0) {
        await q.processItem();
      }

      expect(q.processLog).toEqual([
        {
          type: "out:dialog",
          direction: "request",
          payload: "Good morning",
          queueItem: { text: "Good morning", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "Good morning",
          result: undefined,
          queueItem: { text: "Good morning", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "request",
          payload: "How are you?",
          queueItem: { text: "How are you?", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "How are you?",
          result: undefined,
          queueItem: { text: "How are you?", type: "dialog" },
        },
      ]);
    });

    it("can restore state using events", async () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = helpers(q);

        fadeIn();

        onState(
          (s) => s.dayPart === "morning",
          () => {
            say("Good morning");
            say("How are you?");
          },
          () => {
            say("Good evening!");
          }
        );
        say("Fine.");
        onState(
          (s) => s.dayPart !== "evening",
          () => {
            say("It is early.");
          },
          () => {
            say("Phew it is late!");
          }
        );
      };

      testScript(q);

      bus.listen("out:*", (event) => send.push(event));
      bus.listen("in:*", (event) => received.push(event));
      bus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      /*
      // don't execute last step
      await times(4)(() => q.processItem());

      // Now do a replay
      const steps = q.itemsProcessed;
      expect(steps).toEqual(4);

      const newBus = messageBus();
      const newQ = queue(newBus);
      const stateManager = stateSystem(store);

      newQ.addProcessor(screenProcessor);
      newQ.addProcessor(dialogProcessor);
      newQ.addProcessor(stateManager.stateProcessor);

      testScript(newQ);
      newBus.playbackQueue(received);

      await times(steps)(() => newQ.processItem());

      const newDialog: Event[] = [];
      newBus.listen("out:*", (event) => newDialog.push(event));
      newBus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      await times(3)(() => newQ.processItem());

      expect((newDialog[0] as DialogEvent).text).toEqual("Fine.");
      expect((newDialog[1] as DialogEvent).text).toEqual("It is early.");
      */
    });

    it.skip("can have multiple paths running in parallel", () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = helpers(q);

        fadeIn();
      };

      testScript(q);

      bus.listen("out:*", (event) => send.push(event));
      bus.listen("in:*", (event) => received.push(event));
      bus.listen("out:dialog", () =>
        setTimeout(() => bus.trigger({ type: "in:dialog:done" }), 1)
      );
    });

    it.todo("stops point restoration at the point that content is changed");
  });
});
