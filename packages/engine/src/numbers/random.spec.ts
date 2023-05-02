import { mulberry32 } from "./random";

describe("random", () => {
  describe(mulberry32, () => {
    it("produces the same number given the same seed", () => {
      const seed = 0xdeadbeef;

      const rand = mulberry32(seed);
      expect(rand()).toEqual(0.9413696140982211);
    });

    it("produces the same number sequence given the same seed", () => {
      const seed = 0xdeadbeef;

      const rand = mulberry32(seed);
      expect(rand()).toEqual(0.9413696140982211);
      expect(rand()).toEqual(0.26719574979506433);
    });
  });
});
