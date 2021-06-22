import { isExportDeclaration } from "typescript";
import hash from "./hash";

describe("creating a hash", () => {
  it("creates a reproducable hash", () => {
    const h = hash(
      "Some really long piece of text, possibly 1000s of characters"
    );
    expect(h).toEqual("-tm6ui1");

    const h2 = hash(
      "Some really long piece of text," + " possibly 1000s of characters"
    );

    expect(h).toEqual(h2);

    const h3 = hash(
      // has 1 uppercase character 'Characters'
      "Some really long piece of text, possibly 1000s of Characters"
    );
    expect(h).not.toEqual(h3);
  });

  it("can create a hash of a function", () => {
    const myFunction = () => {
      console.log("hello world");
    };

    const h = hash(myFunction);
    expect(h).toEqual("-37kvnd");

    const otherFunction = () => {
      console.log("Hello world");
      return "more code";
    };

    const h2 = hash(otherFunction);
    expect(h2).toEqual("ff01fs");
  });

  it("can create a hash of an object", () => {
    const myObject = {
      name: "Some Person",
      age: 24,
    };

    const h = hash(myObject);
    expect(h).toEqual("q7e2yb");

    const h2 = hash({ otherObject: "different hash" });
    expect(h2).toEqual("-gwq6ha");
  });
});
