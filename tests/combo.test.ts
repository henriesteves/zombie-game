import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Combo } from "../src/combat/combo";
import { COMBO_CAP, COMBO_WINDOW_MS } from "../src/config";

describe("Combo", () => {
  it("multiplies a chain, freeze-frames without world time, then expires", () => {
    const combo = new Combo();
    assert.equal(combo.note(10).gained, 10);
    assert.equal(combo.hudCount, 1);
    assert.equal(combo.hudLeft, 0);
    combo.tick(0);
    assert.equal(combo.note(10).gained, 20);
    assert.equal(combo.hudCount, 2);
    assert.ok(combo.hudLeft > 0);
    combo.tick(0);
    assert.equal(combo.count, 2);
    combo.tick(COMBO_WINDOW_MS);
    assert.equal(combo.count, 0);
    assert.equal(combo.note(10).gained, 10);
  });

  it("caps the multiplier and marks every fifth kill in a chain", () => {
    const combo = new Combo();
    let marked = 0;
    for (let n = 0; n < COMBO_CAP + 2; n += 1) {
      const step = combo.note(10);
      if (step.mark) marked += 1;
      assert.ok(step.gained <= 10 * COMBO_CAP);
    }
    assert.equal(combo.hudCount, COMBO_CAP);
    assert.ok(marked >= 1);
  });
});
