import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GRENADE_MAX, PICKUP_MAGNET_RADIUS, PLAYER_MAX_HP, WEAPONS, startingAmmo } from "../src/config";
import { acceptsPickup, magnetStep } from "../src/pickups/magnet";

const player = { x: 500, y: 500 };
const distance = (a: { x: number; y: number }) => Math.hypot(a.x - player.x, a.y - player.y);

describe("pickup magnet", () => {
  it("keeps the radius short", () => {
    assert.ok(PICKUP_MAGNET_RADIUS < 120);
  });

  it("slides an accepted pickup inside the radius closer", () => {
    const pickup = { x: player.x + PICKUP_MAGNET_RADIUS - 10, y: player.y };
    const next = magnetStep(pickup, player, true, 16);
    assert.ok(distance(next) < distance(pickup));
  });

  it("leaves a pickup outside the radius where it is", () => {
    const pickup = { x: player.x + PICKUP_MAGNET_RADIUS + 10, y: player.y };
    assert.deepEqual(magnetStep(pickup, player, true, 16), pickup);
  });

  it("leaves a refused pickup where it is", () => {
    const pickup = { x: player.x + 30, y: player.y };
    assert.deepEqual(magnetStep(pickup, player, false, 16), pickup);
  });

  it("does not move without world time", () => {
    const pickup = { x: player.x + 30, y: player.y };
    assert.deepEqual(magnetStep(pickup, player, true, 0), pickup);
  });

  it("refuses health at full hp and ammo for a full gun", () => {
    const ammo = startingAmmo();
    assert.equal(acceptsPickup("health", { getHp: () => PLAYER_MAX_HP, ammo, grenades: 0 }), false);
    assert.equal(acceptsPickup("health", { getHp: () => PLAYER_MAX_HP - 1, ammo, grenades: 0 }), true);
    assert.equal(acceptsPickup("smg", { getHp: () => 1, ammo, grenades: 0 }), true);
    ammo.smg = WEAPONS.smg.ammoMax;
    assert.equal(acceptsPickup("smg", { getHp: () => 1, ammo, grenades: 0 }), false);
    assert.equal(acceptsPickup("grenade", { getHp: () => 1, ammo, grenades: GRENADE_MAX }), false);
    assert.equal(acceptsPickup("grenade", { getHp: () => 1, ammo, grenades: GRENADE_MAX - 1 }), true);
  });
});
