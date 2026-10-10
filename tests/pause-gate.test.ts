import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldResumeWorld } from "../src/input/pause-gate";

describe("shouldResumeWorld", () => {
  it("keeps the world frozen while the player pause or a hit-stop is active", () => {
    assert.equal(shouldResumeWorld(true, 200, 100), false);
    assert.equal(shouldResumeWorld(true, 50, 100), false);
    assert.equal(shouldResumeWorld(false, 50, 100), false);
    assert.equal(shouldResumeWorld(false, 100, 100), true);
  });
});
