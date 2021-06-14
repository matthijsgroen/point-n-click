import messageBus, { Event } from "./messageBus";

describe("MessageBus", () => {
  describe("listeners", () => {
    it("has specified listeners", () => {
      const bus = messageBus();

      const listenerA = jest.fn();
      const listenerB = jest.fn();
      const listenerC = jest.fn();

      const unsubA = bus.listen("background:*", listenerA);
      bus.listen("background:update:now", listenerB);
      bus.listen("background:update", listenerB);
      const event = { type: "background:update", background: "red" };

      bus.trigger(event);

      expect(listenerA).toBeCalledWith(event);
      expect(listenerB).toBeCalledWith(event);
      expect(listenerC).not.toBeCalled();

      listenerA.mockReset();
      listenerB.mockReset();
      listenerC.mockReset();

      unsubA();
      bus.trigger(event);

      expect(listenerA).not.toBeCalled();
      expect(listenerB).toBeCalledWith(event);
      expect(listenerC).not.toBeCalled();
    });

    it.each([
      ["*", true],
      ["background:*", true],
      ["background:*:update", true],
      ["background:image:update", true],
      ["background:color:update", false],
      ["background", false],
    ])("matches event from pattern '%s'", (pattern, doesMatch) => {
      const bus = messageBus();
      const listener = jest.fn();
      bus.listen(pattern, listener);
      const event = { type: "background:image:update", background: "forest" };
      bus.trigger(event);
      if (doesMatch) {
        expect(listener).toBeCalledWith(event);
      } else {
        expect(listener).not.toBeCalled();
      }
    });
  });

  describe("requests", () => {
    it("can register requesthandlers using reply", async () => {
      type SomeRequest = {
        type: "request";
        payload: string;
      };
      const bus = messageBus();
      const unregister = bus.reply(
        "channel:some:request",
        (respond, payload: SomeRequest) => {
          respond(payload + " done!");
        }
      );

      const reply = await bus.request("channel:some:request", "foo");

      expect(reply).toEqual("foo done!");
      unregister();
      expect(bus.request("channel:some:request", "foo")).rejects.toEqual(
        new Error("No responder found for 'channel:some:request'")
      );
    });
  });

  describe("playbackQueue", () => {
    it("emits a message from the queue as soon as someone listens", async () => {
      const event = { type: "background:image:update", background: "forest" };

      const bus = messageBus();
      bus.playbackQueue([event]);

      const listener = jest.fn();
      bus.listen("background:image:update", listener);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(listener).toBeCalledWith(event);
    });
  });
});
