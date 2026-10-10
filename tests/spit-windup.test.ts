import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stepSpitWindup } from "../src/combat/spit-windup";
import { SPITTER_COOLDOWN_MS, SPITTER_WINDUP_MS } from "../src/config";

describe("spitter windup", () => {
  it("is shorter than the spit cooldown", () => {
    assert.ok(SPITTER_WINDUP_MS < SPITTER_COOLDOWN_MS);
  });

  it("keeps holding while the windup is incomplete", () => {
    const step = stepSpitWindup(SPITTER_WINDUP_MS, SPITTER_WINDUP_MS / 2, true, true);
    assert.equal(step.outcome, "hold");
    assert.ok(step.leftMs > 0);
  });

  it("fires exactly once when a full windup ends in range", () => {
    const step = stepSpitWindup(SPITTER_WINDUP_MS, SPITTER_WINDUP_MS, true, true);
    assert.equal(step.outcome, "fire");
    assert.equal(step.leftMs, 0);
  });

  it("does not fire when the windup ends out of range or inactive", () => {
    assert.equal(stepSpitWindup(SPITTER_WINDUP_MS, SPITTER_WINDUP_MS, true, false).outcome, "abort");
    assert.equal(stepSpitWindup(SPITTER_WINDUP_MS, SPITTER_WINDUP_MS, false, true).outcome, "abort");
  });

  it("does not move the windup when no world time passes", () => {
    const step = stepSpitWindup(200, 0, true, true);
    assert.equal(step.outcome, "hold");
    assert.equal(step.leftMs, 200);
  });
});
