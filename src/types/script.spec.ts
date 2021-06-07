import scriptHelpers from "../lib/script-helpers";
import { Script } from "./script";
import queue, { QueueProcessor, Queue } from "../lib/queue";
import messageBus, { MessageBus, Event, Listener } from "../lib/messageBus";
import { stateSystem } from "../lib/gameState";
import { MaybePromise } from "./generic";

type GameState = {
  dayPart: "morning" | "evening";
};

const times = (x: number) => async (f: () => MaybePromise<void>) => {
  if (x > 0) {
    await f();
    await times(x - 1)(f);
  }
};

describe("Script", () => {
  let q: Queue;
  let bus: MessageBus;

  beforeEach(() => {
    bus = messageBus();
    q = queue(bus);
  });

  it("builds a queue on execution", () => {
    const testScript: Script = (q) => {
      const { fadeIn, onState, say } = scriptHelpers<GameState>(q);

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
      handle(item, bus) {
        bus.trigger({ type: "out:screen:effect", effect: item.effect });
      },
    };

    type DialogEvent = {
      type: "dialog";
      text: string;
    };

    const reply = <T extends Event>(
      bus: MessageBus,
      message: T,
      replyType: string,
      listener?: Listener
    ) => {
      return new Promise<void>((resolve) => {
        const unsub = bus.listen(replyType, async (event) => {
          unsub();
          listener && (await listener(event));
          resolve();
        });
        bus.trigger(message);
      });
    };

    const dialogProcessor: QueueProcessor<DialogEvent> = {
      type: "dialog",
      async handle(item, bus) {
        await reply(
          bus,
          { type: "out:dialog", text: item.text },
          "in:dialog:done"
        );
      },
    };

    beforeEach(() => {
      const gameState: GameState = {
        dayPart: "morning",
      };
      const stateManager = stateSystem(gameState);

      q.addProcessor(screenProcessor);
      q.addProcessor(dialogProcessor);
      q.addProcessor(stateManager.stateProcessor);
    });

    it("delegates work to registered processors", async () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = scriptHelpers<GameState>(q);

        fadeIn();
        say("How are you?");
      };

      testScript(q);

      bus.listen("out:*", (event) => send.push(event));
      bus.listen("in:*", (event) => received.push(event));
      bus.listen("out:dialog", () => bus.trigger({ type: "in:dialog:done" }));

      while (q.length > 0) {
        await q.processItem();
      }

      expect(send).toEqual([
        { effect: "fadeIn", type: "out:screen:effect" },
        { text: "How are you?", type: "out:dialog" },
      ]);

      expect(received).toEqual([{ type: "in:dialog:done" }]);
    });

    it("unfolds tasks during execution", async () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = scriptHelpers<GameState>(q);

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
      bus.listen("out:dialog", () => bus.trigger({ type: "in:dialog:done" }));

      while (q.length > 0) {
        await q.processItem();
      }

      expect(send).toEqual([
        { effect: "fadeIn", type: "out:screen:effect" },
        { text: "Good morning", type: "out:dialog" },
        { text: "How are you?", type: "out:dialog" },
      ]);

      expect(received).toEqual([
        { type: "in:dialog:done" },
        { type: "in:dialog:done" },
      ]);
    });

    it("can restore state using events", async () => {
      const received: Event[] = [];
      const send: Event[] = [];

      const testScript: Script = (q) => {
        const { fadeIn, onState, say } = scriptHelpers<GameState>(q);

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
      bus.listen("out:dialog", () =>
        setTimeout(() => bus.trigger({ type: "in:dialog:done" }), 1)
      );

      // don't execute last step
      await times(4)(() => q.processItem());

      // Now do a replay

      const newBus = messageBus();
      const newQ = queue(newBus);
      const gameState: GameState = {
        dayPart: "morning",
      };
      const stateManager = stateSystem(gameState);

      newQ.addProcessor(screenProcessor);
      newQ.addProcessor(dialogProcessor);
      newQ.addProcessor(stateManager.stateProcessor);

      testScript(newQ);
      newBus.playbackQueue(received);

      await times(4)(() => newQ.processItem());

      const newDialog: Event[] = [];
      newBus.listen("out:*", (event) => newDialog.push(event));
      newBus.listen("out:dialog", () =>
        setTimeout(() => newBus.trigger({ type: "in:dialog:done" }), 1)
      );

      await times(3)(() => newQ.processItem());

      expect((newDialog[0] as DialogEvent).text).toEqual("Fine.");
      expect((newDialog[1] as DialogEvent).text).toEqual("It is early.");
    });
  });
});
