import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LOW_HP_BEAT_MIN_MS, LOW_HP_RATIO, PLAYER_MAX_HP } from "../src/config";
import { lowHealthBeatMs } from "../src/fx/low-health";

describe("low health heartbeat", () => {
  it("stays silent at the limit, above it, and at death", () => {
    const limit = LOW_HP_RATIO * PLAYER_MAX_HP;
    assert.equal(lowHealthBeatMs(limit, PLAYER_MAX_HP), null);
    assert.equal(lowHealthBeatMs(limit + 1, PLAYER_MAX_HP), null);
    assert.equal(lowHealthBeatMs(0, PLAYER_MAX_HP), null);
  });

  it("beats faster as health falls, and never faster than the floor", () => {
    const high = lowHealthBeatMs(LOW_HP_RATIO * PLAYER_MAX_HP - 1, PLAYER_MAX_HP);
    const low = lowHealthBeatMs(1, PLAYER_MAX_HP);
    assert.ok(high !== null && low !== null);
    assert.ok(low < high);
    assert.ok(low >= LOW_HP_BEAT_MIN_MS);
    assert.ok(low - LOW_HP_BEAT_MIN_MS < 20);
  });
});
