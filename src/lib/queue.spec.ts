import queue, { QueueProcessor, QueueItem } from "./queue";

describe("Queue", () => {
  it("starts empty", () => {
    const q = queue();
    expect(q).toHaveLength(0);
  });

  describe("processors", () => {
    it("can add a processor that handles items", async () => {
      type TalkQueue = {
        type: "talk";
        dialog: string;
      };

      const itemsHandled: string[] = [];

      const myHandler: QueueProcessor<TalkQueue> = {
        type: "talk",
        handle(item) {
          itemsHandled.push(item.dialog);
        },
      };

      const q = queue();
      q.addProcessor(myHandler);

      q.addItem({
        type: "talk",
        dialog: "Hello world",
      } as TalkQueue);
      q.addItem({ type: "other" });
      q.addItem({
        type: "talk",
        dialog: "Welcome to point-n-click",
      } as TalkQueue);
      expect(q).toHaveLength(3);

      await q.processItem();
      expect(itemsHandled).toEqual(["Hello world"]);
      await q.processItem();
      await q.processItem();
      expect(itemsHandled).toEqual(["Hello world", "Welcome to point-n-click"]);
    });
  });

  it.todo("can skip to an item");
  it.todo("can 'unfold' items");
  it.todo("keeps a pointer to its queue position");
});
