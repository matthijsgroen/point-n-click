import { observableList } from "./notificationList";

describe("notificationList", () => {
  it("allows adding single item", () => {
    const list = observableList<string>();
    list.add("Foo");

    const result = list.getCollection();
    expect(result).toEqual(["Foo"]);
  });

  it("allows adding multiple items", () => {
    const list = observableList<string>();
    list.add("Foo");
    list.add("Bar", "Baz");

    const result = list.getCollection();
    expect(result).toEqual(["Foo", "Bar", "Baz"]);
  });

  it("allows subscriptions on changes", () => {
    const subscription = jest.fn();
    const list = observableList<string>();
    list.add("Foo");
    list.subscribe(subscription);
    list.add("Bar", "Baz");

    expect(subscription).toHaveBeenCalledWith(list);
  });

  it("calls subscribers for every change", () => {
    const subscription = jest.fn();
    const list = observableList<string>();
    list.subscribe(subscription);
    list.add("Foo");
    list.add("Bar", "Baz");

    expect(subscription).toHaveBeenCalledTimes(2);
  });

  it("allows subscriptions to unsubscribe", () => {
    const subscription = jest.fn();
    const list = observableList<string>();
    const unsubscribe = list.subscribe(subscription);
    list.add("Foo");
    unsubscribe();
    list.add("Bar", "Baz");

    expect(subscription).toHaveBeenCalledTimes(1);
  });
});
