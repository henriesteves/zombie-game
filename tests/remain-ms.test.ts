import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isExpired, remainMs } from "../src/time/remain-ms";

describe("remainMs", () => {
  it("does not move when the world is frozen", () => {
    assert.equal(remainMs(500, 0), 500);
    assert.equal(isExpired(500), false);
  });

  it("counts down only by the world delta and expires at zero", () => {
    assert.equal(remainMs(500, 200), 300);
    assert.equal(remainMs(50, 80), 0);
    assert.equal(isExpired(0), true);
  });
});
