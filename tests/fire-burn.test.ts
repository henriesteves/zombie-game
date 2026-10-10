import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isInsideFire } from "../src/combat/fire-burn";
import {
  CAR_BLAST_RADIUS, CAR_FIRE_PLAYER_DAMAGE, CAR_FIRE_RADIUS, CAR_FIRE_ZOMBIE_DAMAGE,
  CAR_PLAYER_DAMAGE, CAR_ZOMBIE_DAMAGE,
} from "../src/config";

describe("car fire burn", () => {
  const fire = { x: 400, y: 900 };

  it("hits a point inside the fire radius", () => {
    const point = { x: fire.x + CAR_FIRE_RADIUS - 1, y: fire.y };
    assert.equal(isInsideFire(point, fire, CAR_FIRE_RADIUS), true);
  });

  it("misses a point outside the fire radius", () => {
    const point = { x: fire.x + CAR_FIRE_RADIUS + 1, y: fire.y };
    assert.equal(isInsideFire(point, fire, CAR_FIRE_RADIUS), false);
  });

  it("stays weaker and smaller than the car blast", () => {
    assert.ok(CAR_FIRE_RADIUS < CAR_BLAST_RADIUS);
    assert.ok(CAR_FIRE_ZOMBIE_DAMAGE < CAR_ZOMBIE_DAMAGE);
    assert.ok(CAR_FIRE_PLAYER_DAMAGE < CAR_PLAYER_DAMAGE);
  });
});
