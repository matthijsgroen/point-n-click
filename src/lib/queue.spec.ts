import scriptHelpers from "./script-helpers";
import { Script } from "../types/script";
import queue, { QueueProcessor, Queue } from "./queue";
import messageBus, { MessageBus, Event, Listener } from "./messageBus";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { stateSystem } from "./script-helpers/state";
import { callbackSystem } from "./queue-utils/callback";
import times from "./test-helpers/times";

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
      const callbackManager = callbackSystem(store);

      q.addProcessor(screenProcessor);
      q.addProcessor(dialogProcessor);
      q.addProcessor(stateManager.processor);
      q.addProcessor(callbackManager.processor);
    });

    it("delegates work to registered processors", async () => {
      const testScript: Script = (q) => {
        const { fadeIn, say } = helpers(q);

        fadeIn();
        say("How are you?");
      };

      testScript(q);

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
          queueItem: { hash: "-ufpg3", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "How are you?",
          queueItem: { hash: "-ufpg3", type: "dialog" },
        },
      ]);
    });

    it("unfolds tasks during execution", async () => {
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
          queueItem: { hash: "tw31bm", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "Good morning",
          result: undefined,
          queueItem: { hash: "tw31bm", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "request",
          payload: "How are you?",
          queueItem: { hash: "-ufpg3", type: "dialog" },
        },
        {
          type: "out:dialog",
          direction: "response",
          payload: "How are you?",
          result: undefined,
          queueItem: { hash: "-ufpg3", type: "dialog" },
        },
      ]);
    });

    it("can restore state using events", async () => {
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
        // -- first run stops here --
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

      bus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      // don't execute last step
      await times(4)(() => q.processItem());

      // Now do a replay
      const steps = q.itemsProcessed;
      expect(steps).toEqual(4);
      const log = q.processLog;

      const newBus = messageBus();
      const newQ = queue(newBus);
      const stateManager = stateSystem(store);

      newBus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );

      newQ.addProcessor(screenProcessor);
      newQ.addProcessor(dialogProcessor);
      newQ.addProcessor(stateManager.processor);

      testScript(newQ);

      const success = await newQ.replay(log);

      expect(success).toEqual(true);

      await times(3)(() => newQ.processItem());
      const newLog = newQ.processLog;
      const dialogTexts = newLog
        .filter((item) => item.direction === "request")
        .map((item) => item.payload);

      expect(dialogTexts).toEqual([
        "Good morning",
        "How are you?",
        "Fine.",
        "It is early.",
      ]);
    });

    it("can have multiple paths running in parallel", async () => {
      const testScript: Script = (q) => {
        const { fadeIn, buttons, say } = helpers(q);

        fadeIn();
        buttons([
          {
            id: "character",
            hoverEffect: "glow",
            coordinates: [730, 0, 919, 0, 890, 95, 730, 191],
            onClick: ({ hide, show }) => {
              hide();
              say("Hey, how are you?");
              say("Do you have any money?");
              say("Thanks!");
              show();
            },
          },
          {
            id: "inventory",
            hoverEffect: "glow",
            coordinates: [730, 0, 919, 0, 890, 95, 730, 191],
            onClick: ({ hide, show }) => {
              hide();
              say("Here, some money!");
              show();
              buttons([
                {
                  id: "extraPath",
                  hoverEffect: "glow",
                  coordinates: [730, 0, 919, 0, 890, 95, 730, 191],
                  onClick: () => {
                    say("Hey, how are you?");
                    say("Do you have any money?");
                  },
                },
              ]);
            },
          },
        ]);

        say("Wow nice here!");
      };

      testScript(q);

      /**
       * A script is never truely finished. It either waits until new items are added to process.
       * Or it jumps or ends through a command.
       * This will eliminate the need for a 'hold' command to keep listening for button
       * events that triggers a new sub-queue.
       */

      bus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );
      bus.reply(
        "ui:waitButtonPress",
        (reply: (result: string) => void, payload: { items: string[] }) => {
          if (payload.items.includes("inventory")) {
            setTimeout(() => reply("inventory"), 10);
          }
        }
      );

      await q.processItem();
      await q.processItem();
      await q.processItem();

      await q.waitForItem();

      await q.processItem();
      await q.processItem();

      const log = JSON.stringify(q.processLog);

      // Wait for 'exit'?

      const newBus = messageBus();
      const newQ = queue(newBus);

      const stateManager = stateSystem(store);
      const callbackManager = callbackSystem(store);

      newQ.addProcessor(screenProcessor);
      newQ.addProcessor(dialogProcessor);
      newQ.addProcessor(stateManager.processor);
      newQ.addProcessor(callbackManager.processor);

      newBus.reply(
        "out:dialog",
        (reply: (result: void) => void, _payload: string) => {
          reply();
        }
      );
      newBus.reply(
        "ui:waitButtonPress",
        (reply: (result: string) => void, payload: { items: string[] }) => {
          if (payload.items.includes("inventory")) {
            setTimeout(() => reply("inventory"), 10);
          }
        }
      );

      testScript(newQ);

      const success = await newQ.replay(JSON.parse(log));
      expect(success).toEqual(true);

      const newLog = newQ.processLog;
      const dialogTexts = newLog
        .map((item) => {
          switch (item.type) {
            case "ui:waitButtonPress":
              return item.direction === "request"
                ? `waiting for button press ${item.payload.items.join(",")}`
                : `pressed ${item.result}`;
            case "out:dialog":
              return item.direction === "request" ? item.payload : null;
          }
          return null;
        })
        .filter((item) => item !== null);

      expect(dialogTexts).toEqual([
        "waiting for button press character,inventory",
        "Wow nice here!",
        "pressed inventory",
        "Here, some money!",
        "waiting for button press extraPath",
      ]);
    });
  });
});
