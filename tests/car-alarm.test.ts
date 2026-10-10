import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tickCarAlarm } from "../src/combat/car-alarm";
import { ALARM_DURATION } from "../src/config";

describe("car alarm clock", () => {
  it("does not run down while the world is frozen", () => {
    const paused = tickCarAlarm(ALARM_DURATION, 0, 0);
    assert.equal(paused.left, ALARM_DURATION);
    assert.ok(paused.tint !== null);
  });

  it("expires after the full duration of world time", () => {
    const mid = tickCarAlarm(ALARM_DURATION, 0, ALARM_DURATION / 2);
    assert.ok(mid.left > 0);
    assert.ok(mid.tint !== null);
    const done = tickCarAlarm(mid.left, mid.blink, ALARM_DURATION);
    assert.equal(done.left, 0);
    assert.equal(done.tint, null);
  });
});
