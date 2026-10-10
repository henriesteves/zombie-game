import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WeaponWheel, weaponAtAngle } from "../src/combat/weapon-wheel";
import { WEAPON_ORDER, startingAmmo } from "../src/config";

const TAU = Math.PI * 2;
const TOP = -Math.PI / 2;

function aimAt(index: number): number {
  const sector = TAU / WEAPON_ORDER.length;
  return TOP + sector * index + sector / 2;
}

describe("weapon wheel", () => {
  it("walks the circle clockwise from the top", () => {
    WEAPON_ORDER.forEach((id, index) => {
      assert.equal(weaponAtAngle(aimAt(index)), id);
    });
  });

  it("switches only when the wheel closes on a loaded gun", () => {
    const wheel = new WeaponWheel();
    const ammo = startingAmmo();
    const held = wheel.sample({ held: true, aimed: true, aim: aimAt(3), ammo, current: "pistol" });
    assert.equal(held.open, true);
    assert.equal(held.chosen, null);
    assert.equal(wheel.highlight, "rifle");
    const closed = wheel.sample({ held: false, aimed: true, aim: aimAt(3), ammo, current: "pistol" });
    assert.equal(closed.open, false);
    assert.equal(closed.chosen, "rifle");
  });

  it("keeps the current gun when the highlighted one is empty or already equipped", () => {
    const ammo = startingAmmo();
    ammo.magnum = 0;
    const empty = new WeaponWheel();
    empty.sample({ held: true, aimed: true, aim: aimAt(4), ammo, current: "pistol" });
    assert.equal(empty.sample({ held: false, aimed: false, aim: 0, ammo, current: "pistol" }).chosen, null);
    const same = new WeaponWheel();
    same.sample({ held: true, aimed: false, aim: 0, ammo, current: "smg" });
    assert.equal(same.highlight, "smg");
    assert.equal(same.sample({ held: false, aimed: false, aim: 0, ammo, current: "smg" }).chosen, null);
  });

  it("forgets a held wheel when play stops", () => {
    const wheel = new WeaponWheel();
    const ammo = startingAmmo();
    wheel.sample({ held: true, aimed: true, aim: aimAt(1), ammo, current: "pistol" });
    wheel.cancel();
    assert.equal(wheel.open, false);
    assert.equal(wheel.sample({ held: false, aimed: true, aim: aimAt(1), ammo, current: "pistol" }).chosen, null);
  });
});
