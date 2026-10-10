import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wantsBootStart } from "../src/input/boot-start";

describe("wantsBootStart", () => {
  it("starts from a click, a key, or a pad confirm, and ignores an idle frame", () => {
    assert.equal(wantsBootStart(true, false, false), true);
    assert.equal(wantsBootStart(false, true, false), true);
    assert.equal(wantsBootStart(false, false, true), true);
    assert.equal(wantsBootStart(false, false, false), false);
  });
});
