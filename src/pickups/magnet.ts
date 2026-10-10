import {
  GRENADE_MAX, PICKUP_MAGNET_RADIUS, PICKUP_MAGNET_SPEED, PLAYER_MAX_HP, WEAPONS, type PickupKind, type WeaponId,
} from "../config";

export interface MagnetPoint {
  x: number;
  y: number;
}

export interface PickupNeeds {
  getHp(): number;
  ammo: Record<WeaponId, number>;
  grenades: number;
}

/** A full bar, a full gun, or a full grenade belt refuses its pickup. */
export function acceptsPickup(kind: PickupKind, needs: PickupNeeds): boolean {
  if (kind === "health") return needs.getHp() < PLAYER_MAX_HP;
  if (kind === "grenade") return needs.grenades < GRENADE_MAX;
  return needs.ammo[kind] < WEAPONS[kind].ammoMax;
}

/** Where a pickup sits after one world step: it slides toward the player only if accepted and in range. */
export function magnetStep(pickup: MagnetPoint, player: MagnetPoint, accepted: boolean, deltaMs: number): MagnetPoint {
  if (!accepted || deltaMs <= 0) return { x: pickup.x, y: pickup.y };
  const dx = player.x - pickup.x;
  const dy = player.y - pickup.y;
  const distance = Math.hypot(dx, dy);
  if (distance > PICKUP_MAGNET_RADIUS || distance === 0) return { x: pickup.x, y: pickup.y };
  const travel = Math.min(distance, (PICKUP_MAGNET_SPEED * deltaMs) / 1000);
  return { x: pickup.x + (dx / distance) * travel, y: pickup.y + (dy / distance) * travel };
}
