import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ChargeClock } from "../src/combat/charge-clock";
import { ZOMBIES } from "../src/config";

const brute = ZOMBIES.brute.charge!;

describe("ChargeClock", () => {
  it("holds the windup until world time covers it, then dashes once", () => {
    const clock = new ChargeClock();
    assert.equal(clock.advance(0, true, brute), "start");
    assert.equal(clock.advance(brute.windupMs / 2, true, brute), "hold");
    assert.equal(clock.advance(0, true, brute), "hold");
    assert.equal(clock.advance(brute.windupMs, true, brute), "dash");
    assert.equal(clock.state, "dash");
    assert.equal(clock.advance(brute.dashMs / 2, true, brute), "dash");
    assert.equal(clock.advance(0, true, brute), "dash");
    assert.equal(clock.advance(brute.dashMs, true, brute), null);
    assert.equal(clock.state, "idle");
  });

  it("does not start a windup out of range or while cooling down", () => {
    const clock = new ChargeClock();
    assert.equal(clock.advance(16, false, brute), null);
    clock.advance(0, true, brute);
    clock.interrupt(brute.cooldownMs);
    assert.equal(clock.state, "idle");
    assert.equal(clock.advance(brute.cooldownMs / 2, true, brute), null);
    assert.equal(clock.advance(0, true, brute), null);
    assert.equal(clock.advance(brute.cooldownMs, true, brute), "start");
  });
});
