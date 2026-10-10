import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextMenuAction } from "../src/input/menu-action";

describe("nextMenuAction", () => {
  it("pauses from Start while alive and restarts from the bottom button only after death", () => {
    assert.equal(nextMenuAction(false, true, false), "pause");
    assert.equal(nextMenuAction(true, true, false), "none");
    assert.equal(nextMenuAction(true, false, true), "restart");
    assert.equal(nextMenuAction(false, false, true), "none");
    assert.equal(nextMenuAction(false, false, false), "none");
  });
});
