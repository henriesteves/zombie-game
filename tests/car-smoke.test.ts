import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { carHitEffect } from "../src/combat/car-smoke";
import { CAR_HITS, CAR_SMOKE_HITS } from "../src/config";

describe("car smoke", () => {
  it("stays quiet below the threshold, smokes on it, and still wrecks at the last hit", () => {
    assert.equal(carHitEffect(CAR_SMOKE_HITS - 1), "intact");
    assert.equal(carHitEffect(CAR_SMOKE_HITS), "smoke");
    assert.equal(carHitEffect(CAR_HITS - 1), "smoke");
    assert.equal(carHitEffect(CAR_HITS), "wreck");
    assert.ok(CAR_SMOKE_HITS < CAR_HITS);
  });
});