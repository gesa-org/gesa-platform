import { shuffleArray } from "@/lib/shuffleArray";

describe("shuffleArray", () => {
  it("uses Fisher–Yates without mutating the source array", () => {
    const source = ["a", "b", "c"];

    expect(shuffleArray(source, () => 0)).toEqual(["b", "c", "a"]);
    expect(source).toEqual(["a", "b", "c"]);
  });
});
