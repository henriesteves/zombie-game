import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PlayerKnock, knockVelocity } from "../src/combat/player-knock";
import { KNOCK_MS, KNOCK_SPEED } from "../src/config";

describe("player knockback", () => {
  it("pushes away from the source and replaces a knock instead of adding it", () => {
    const away = knockVelocity(30, 0, 0, 0);
    assert.equal(away.x, KNOCK_SPEED);
    assert.equal(away.y, 0);
    const knock = new PlayerKnock();
    knock.replace(30, 0, 0, 0);
    knock.replace(0, 40, 0, 0);
    const velocity = knock.velocity(16);
    assert.ok(velocity);
    assert.equal(velocity.x, 0);
    assert.equal(velocity.y, KNOCK_SPEED);
    assert.ok(Math.hypot(velocity.x, velocity.y) < KNOCK_SPEED * 2);
  });

  it("freezes until advanced again, and death or restart clears it", () => {
    const knock = new PlayerKnock();
    knock.replace(10, 0, 0, 0);
    assert.equal(knock.velocity(0)?.x, KNOCK_SPEED);
    const resumed = knock.velocity(KNOCK_MS);
    assert.equal(resumed?.x, KNOCK_SPEED);
    assert.equal(knock.velocity(16), null);
    knock.replace(10, 0, 0, 0);
    knock.reset();
    assert.equal(knock.velocity(16), null);
  });
});