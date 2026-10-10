import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { playerPush } from "../src/ai/player-push";
import { HORDE_PLAYER_PUSH_MAX, HORDE_PLAYER_PUSH_RADIUS } from "../src/config";

describe("horde push around the player", () => {
  const player = { x: 300, y: 300 };

  it("pushes a point inside the radius outward, within the cap", () => {
    const push = playerPush(player.x + 10, player.y, player.x, player.y);
    assert.ok(push.x > 0);
    assert.equal(push.y, 0);
    assert.ok(Math.hypot(push.x, push.y) <= HORDE_PLAYER_PUSH_MAX);
    const center = playerPush(player.x, player.y, player.x, player.y);
    assert.ok(Math.hypot(center.x, center.y) <= HORDE_PLAYER_PUSH_MAX);
    const above = playerPush(player.x, player.y - 10, player.x, player.y);
    assert.ok(above.y < 0);
  });

  it("returns zero outside the radius", () => {
    const push = playerPush(player.x + HORDE_PLAYER_PUSH_RADIUS + 1, player.y, player.x, player.y);
    assert.deepEqual(push, { x: 0, y: 0 });
  });
});
