import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ZOMBIES } from "../src/config";
import type { WaveModifier } from "../src/waves/wave-director";
import { getSpawnBands, pickLiveKind, pickSpawnKind } from "../src/waves/wave-director";

const MODIFIERS: WaveModifier[] = ["clear", "runners", "brute", "alarms"];
const ROLL_STEPS = 20;

describe("spitter spawn", () => {
  it("never returns a spitter during wave 3", () => {
    for (const modifier of MODIFIERS) {
      assert.equal(getSpawnBands(3, modifier).spitter, 0);
      for (let step = 0; step < ROLL_STEPS; step += 1) {
        const roll = step / ROLL_STEPS;
        assert.notEqual(pickSpawnKind(3, modifier, roll), "spitter");
        assert.notEqual(pickLiveKind("fight", 3, modifier, roll), "spitter");
        assert.notEqual(pickLiveKind("calm", 3, modifier, roll), "spitter");
      }
    }
  });

  it("returns a spitter on wave 4 when the roll lands in its band, and a walker during calm", () => {
    const bands = getSpawnBands(4, "alarms");
    const roll = bands.brute + bands.runner + bands.bloater + bands.spitter / 2;
    assert.equal(pickSpawnKind(4, "alarms", roll), "spitter");
    assert.equal(pickLiveKind("fight", 4, "alarms", roll), "spitter");
    assert.equal(pickLiveKind("calm", 4, "alarms", roll), "walker");
    assert.ok(ZOMBIES.spitter.speed < ZOMBIES.runner.speed);
  });
});
