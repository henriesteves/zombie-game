import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldResumeWorld } from "../src/input/pause-gate";

describe("shouldResumeWorld", () => {
  it("keeps the world frozen while the player pause or a hit-stop is active", () => {
    assert.equal(shouldResumeWorld(true, 0), false);
    assert.equal(shouldResumeWorld(true, 80), false);
    assert.equal(shouldResumeWorld(false, 80), false);
    assert.equal(shouldResumeWorld(false, 0), true);
  });
});
