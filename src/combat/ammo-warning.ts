import { AMMO_LOW_RATIO } from "../config";

/** True when a finite gun drops below AMMO_LOW_RATIO of its max. The pistol never warns. */
export function isAmmoLow(ammo: number, ammoMax: number): boolean {
  if (!Number.isFinite(ammoMax) || !Number.isFinite(ammo)) return false;
  return ammo < ammoMax * AMMO_LOW_RATIO;
}
