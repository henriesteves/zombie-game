import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceDelayedCalls } from "../src/combat/blast-delay";

describe("blast delay queue", () => {
  it("does not fire while no world time passes", () => {
    const queue = [{ delayMs: 110, id: "barrel" }];
    assert.deepEqual(advanceDelayedCalls(queue, 0), []);
    assert.equal(queue[0].delayMs, 110);
  });

  it("fires each follow-up once when its delay elapses", () => {
    const queue = [{ delayMs: 110, id: "barrel" }, { delayMs: 160, id: "car" }];
    assert.equal(advanceDelayedCalls(queue, 50).length, 0);
    const first = advanceDelayedCalls(queue, 60);
    assert.deepEqual(first.map((item) => item.id), ["barrel"]);
    const second = advanceDelayedCalls(queue, 50);
    assert.deepEqual(second.map((item) => item.id), ["car"]);
    assert.equal(queue.length, 0);
    assert.equal(advanceDelayedCalls(queue, 100).length, 0);
  });
});
