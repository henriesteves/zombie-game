import Phaser from "phaser";
import {
  DROP_HEALTH, DROP_SHOTGUN, DROP_SMG, HEALTH_PICKUP, PICKUP_LIFE_MS, PLAYER_MAX_HP, WEAPONS, WORLD_H, WORLD_W,
  type PickupKind, type WeaponId,
} from "../config";

type Sprite = Phaser.Physics.Arcade.Sprite;

const CACHE_OFFSET = 28;

export interface PickupHost {
  now(): number;
  getHp(): number;
  setHp(hp: number): void;
  ammo: Record<WeaponId, number>;
  playPickup(): void;
}

export class PickupDrops {
  constructor(
    private readonly group: Phaser.Physics.Arcade.Group,
    private readonly host: PickupHost,
  ) {}

  update(time: number) {
    for (const child of this.group.getChildren().slice()) {
      const pickup = child as Sprite;
      if (!pickup.active) continue;
      if (time > (pickup.getData("dieAt") as number)) {
        pickup.destroy();
        continue;
      }
      pickup.setScale(1 + Math.sin(time / 180) * 0.08);
    }
  }

  drop(x: number, y: number) {
    const kind = rollDrop(Math.random());
    if (!kind) return;
    this.spawn(x, y, kind);
  }

  dropCalmCache() {
    const centerX = WORLD_W / 2;
    const centerY = WORLD_H / 2;
    this.spawn(centerX - CACHE_OFFSET, centerY, "health");
    const gun = scarcerGun(this.host.ammo);
    if (gun) this.spawn(centerX + CACHE_OFFSET, centerY, gun);
  }

  spawn(x: number, y: number, kind: PickupKind) {
    const pickup = this.group.create(x, y, `pickup_${kind}`) as Sprite;
    pickup.setDepth(6).setData("kind", kind).setData("dieAt", this.host.now() + PICKUP_LIFE_MS);
  }

  collect(pickup: Sprite) {
    if (!pickup.active) return;
    if (!applyPickup(pickup.getData("kind") as PickupKind, this.host)) return;
    this.host.playPickup();
    pickup.destroy();
  }
}

export function rollDrop(roll: number): PickupKind | null {
  if (roll < DROP_HEALTH) return "health";
  if (roll < DROP_HEALTH + DROP_SMG) return "smg";
  if (roll < DROP_HEALTH + DROP_SMG + DROP_SHOTGUN) return "shotgun";
  return null;
}

export function scarcerGun(ammo: Record<WeaponId, number>): "smg" | "shotgun" | null {
  const smgFill = ammo.smg / WEAPONS.smg.ammoMax;
  const shotgunFill = ammo.shotgun / WEAPONS.shotgun.ammoMax;
  if (smgFill >= 1 && shotgunFill >= 1) return null;
  if (smgFill <= shotgunFill) return "smg";
  return "shotgun";
}

function applyPickup(kind: PickupKind, host: PickupHost): boolean {
  if (kind === "health") return applyHealth(host);
  return applyAmmo(kind, host);
}

function applyHealth(host: PickupHost): boolean {
  if (host.getHp() >= PLAYER_MAX_HP) return false;
  host.setHp(Math.min(PLAYER_MAX_HP, host.getHp() + HEALTH_PICKUP));
  return true;
}

function applyAmmo(kind: "smg" | "shotgun", host: PickupHost): boolean {
  const weapon = WEAPONS[kind];
  if (host.ammo[kind] >= weapon.ammoMax) return false;
  host.ammo[kind] = Math.min(weapon.ammoMax, host.ammo[kind] + weapon.ammoPerPickup);
  return true;
}
