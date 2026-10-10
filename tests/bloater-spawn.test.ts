import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WaveModifier } from "../src/waves/wave-director";
import { getSpawnBands, pickLiveKind, pickSpawnKind } from "../src/waves/wave-director";

const MODIFIERS: WaveModifier[] = ["clear", "runners", "brute", "alarms"];
const ROLL_STEPS = 20;

describe("bloater spawn", () => {
  it("never returns a bloater during wave 2", () => {
    for (const modifier of MODIFIERS) {
      assert.equal(getSpawnBands(2, modifier).bloater, 0);
      for (let step = 0; step < ROLL_STEPS; step += 1) {
        const roll = step / ROLL_STEPS;
        assert.notEqual(pickSpawnKind(2, modifier, roll), "bloater");
        assert.notEqual(pickLiveKind("fight", 2, modifier, roll), "bloater");
        assert.notEqual(pickLiveKind("calm", 2, modifier, roll), "bloater");
      }
    }
  });

  it("returns a bloater on wave 3 when the roll lands in its band", () => {
    const bands = getSpawnBands(3, "brute");
    const roll = bands.brute + bands.runner + bands.bloater / 2;
    assert.equal(pickSpawnKind(3, "brute", roll), "bloater");
    assert.equal(pickLiveKind("fight", 3, "brute", roll), "bloater");
    assert.equal(pickLiveKind("calm", 3, "brute", roll), "walker");
  });
});
