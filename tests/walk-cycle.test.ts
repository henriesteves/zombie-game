import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACTORS } from "../src/assets/pixel-frames";
import { WALK_MIN_SPEED, WALK_STEP_MS, deadTexture, isWalking, walkAge, walkTexture } from "../src/fx/walk-cycle";

describe("walk cycle", () => {
  it("stands through the first interval, then alternates", () => {
    assert.equal(walkTexture("zombie_walker", 0), "zombie_walker");
    assert.equal(walkTexture("zombie_walker", WALK_STEP_MS - 1), "zombie_walker");
    assert.equal(walkTexture("zombie_walker", WALK_STEP_MS), "zombie_walker_step");
    assert.equal(walkTexture("zombie_walker", WALK_STEP_MS * 2), "zombie_walker");
  });

  it("resets while standing and accumulates while moving", () => {
    assert.equal(walkAge(400, 16, false), 0);
    assert.equal(walkAge(40, 16, true), 56);
    assert.equal(isWalking(WALK_MIN_SPEED - 1), false);
    assert.equal(isWalking(WALK_MIN_SPEED), true);
  });

  it("names the prone texture beside the live one", () => {
    assert.equal(deadTexture("player"), "player_dead");
    assert.equal(deadTexture("zombie_brute"), "zombie_brute_dead");
  });
});

describe("pixel frames", () => {
  it("keeps every pose on the same 16 by 16 grid", () => {
    assert.equal(ACTORS.length, 6);
    for (const actor of ACTORS) {
      for (const frame of [actor.idle, actor.step, actor.dead]) {
        assert.equal(frame.length, 16);
        for (const row of frame) {
          assert.equal(row.length, 16);
          for (const glyph of row) {
            if (glyph === ".") continue;
            assert.ok(actor.palette[glyph], `${actor.key} has no color for ${glyph}`);
          }
        }
      }
    }
  });
});
