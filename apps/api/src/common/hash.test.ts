import { describe, expect, it } from "vitest";
import { calculateConfigHash } from "./hash.js";

describe("calculateConfigHash", () => {
  it("is stable for object key order", () => {
    const left = calculateConfigHash({ b: 2, a: { d: 4, c: 3 } });
    const right = calculateConfigHash({ a: { c: 3, d: 4 }, b: 2 });

    expect(left).toBe(right);
  });
});
