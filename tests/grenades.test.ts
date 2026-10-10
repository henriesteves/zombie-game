import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stepGrenade, throwGrenade } from "../src/combat/grenades";
import { GRENADE_FUSE_MS, GRENADE_START } from "../src/config";

describe("grenades", () => {
  it("does not detonate before the fuse ends", () => {
    const thrown = throwGrenade({ count: GRENADE_START, aim: 0, x: 0, y: 0, cooldownMs: 0 });
    const step = stepGrenade(thrown.body!, GRENADE_FUSE_MS - 1);
    assert.equal(step.detonated, false);
    assert.equal(step.body.fuseMs, 1);
  });

  it("detonates when the fuse elapses", () => {
    const thrown = throwGrenade({ count: 1, aim: 0, x: 10, y: 20, cooldownMs: 0 });
    const step = stepGrenade(thrown.body!, GRENADE_FUSE_MS);
    assert.equal(step.detonated, true);
    assert.equal(step.body.fuseMs, 0);
  });

  it("does not throw without a grenade", () => {
    const thrown = throwGrenade({ count: 0, aim: 0, x: 0, y: 0, cooldownMs: 0 });
    assert.equal(thrown.body, null);
    assert.equal(thrown.empty, true);
    assert.equal(thrown.count, 0);
  });

  it("does not burn the fuse while time is stopped", () => {
    const thrown = throwGrenade({ count: 1, aim: 1, x: 4, y: 8, cooldownMs: 0 });
    const step = stepGrenade(thrown.body!, 0);
    assert.equal(step.detonated, false);
    assert.equal(step.body.fuseMs, GRENADE_FUSE_MS);
    assert.equal(step.body.x, thrown.body!.x);
    assert.equal(step.body.y, thrown.body!.y);
  });
});
