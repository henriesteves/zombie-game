import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAmmoLow } from "../src/combat/ammo-warning";
import { AMMO_LOW_RATIO, WEAPONS } from "../src/config";

describe("low ammo warning", () => {
  const max = WEAPONS.smg.ammoMax;

  it("does not warn above the fraction", () => {
    assert.equal(isAmmoLow(Math.ceil(max * AMMO_LOW_RATIO) + 1, max), false);
  });

  it("warns below the fraction", () => {
    assert.equal(isAmmoLow(Math.floor(max * AMMO_LOW_RATIO) - 1, max), true);
  });

  it("never warns for infinite ammo", () => {
    assert.equal(isAmmoLow(WEAPONS.pistol.ammoStart, WEAPONS.pistol.ammoMax), false);
  });

  it("warns at zero for a finite gun", () => {
    assert.equal(isAmmoLow(0, WEAPONS.shotgun.ammoMax), true);
  });
});
