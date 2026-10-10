import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bloaterScale, bloaterSize } from "../src/combat/bloater-swell";
import { BLOATER_SWELL_RATIO, BLOATER_SWELL_SCALE, ZOMBIES } from "../src/config";

describe("bloater swell", () => {
  const maxHp = ZOMBIES.bloater.hp;
  const threshold = maxHp * BLOATER_SWELL_RATIO;

  it("asks for normal size above the fraction", () => {
    assert.equal(bloaterSize(maxHp, maxHp), "normal");
    assert.equal(bloaterSize(threshold + 1, maxHp), "normal");
    assert.equal(bloaterSize(threshold, maxHp), "normal");
    assert.equal(bloaterScale(maxHp, maxHp), 1);
    assert.equal(bloaterScale(threshold + 1, maxHp), 1);
  });

  it("asks for swollen below the fraction and above zero", () => {
    assert.equal(bloaterSize(threshold - 1, maxHp), "swollen");
    assert.equal(bloaterSize(1, maxHp), "swollen");
    assert.equal(bloaterScale(threshold - 1, maxHp), BLOATER_SWELL_SCALE);
    assert.equal(bloaterScale(1, maxHp), BLOATER_SWELL_SCALE);
    assert.ok(BLOATER_SWELL_SCALE > 1);
  });

  it("does not ask for swollen at zero hp or below", () => {
    assert.equal(bloaterSize(0, maxHp), "normal");
    assert.equal(bloaterSize(-1, maxHp), "normal");
    assert.equal(bloaterScale(0, maxHp), 1);
    assert.equal(bloaterScale(-2, maxHp), 1);
  });

  it("keeps the swell ratio between 0 and 1", () => {
    assert.ok(BLOATER_SWELL_RATIO > 0 && BLOATER_SWELL_RATIO < 1);
  });
});
