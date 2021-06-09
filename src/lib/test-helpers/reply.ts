import { Listener, MessageBus, Event } from "../messageBus";

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

export default reply;
