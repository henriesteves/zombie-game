import Phaser from "phaser";
import * as sfx from "../audio/sfx";
import { WEAPONS, WEAPON_ORDER, type WeaponId } from "../config";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;

const EMPTY_CLICK_MS = 250;
const MUZZLE_DISTANCE = 30;
const SHAKE_MS = 60;
const BULLET_RADIUS = 4;

const WEAPON_SFX: Record<WeaponId, () => void> = {
  pistol: sfx.pistol, smg: sfx.smg, shotgun: sfx.shotgun, rifle: sfx.rifle, magnum: sfx.magnum,
};

const HOTKEYS: { event: string; id: WeaponId }[] = [
  { event: "keydown-ONE", id: "pistol" },
  { event: "keydown-TWO", id: "smg" },
  { event: "keydown-THREE", id: "shotgun" },
  { event: "keydown-FOUR", id: "rifle" },
  { event: "keydown-FIVE", id: "magnum" },
];

export function bindWeaponHotkeys(
  keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
  choose: (id: WeaponId) => void,
): void {
  for (const hotkey of HOTKEYS) keyboard.on(hotkey.event, () => choose(hotkey.id));
}

export interface GunHost {
  ammo: Record<WeaponId, number>;
  light: { flash: number };
  weapon(): WeaponId;
  setWeapon(id: WeaponId): void;
  nextShot(): number;
  setNextShot(time: number): void;
  player(): { x: number; y: number };
  bullets(): Phaser.Physics.Arcade.Group;
  physics(): Phaser.Physics.Arcade.ArcadePhysics;
  camera(): Phaser.Cameras.Scene2D.Camera;
}

export class Gun {
  constructor(private readonly host: GunHost) {}

  set(id: WeaponId): void {
    if (this.host.ammo[id] <= 0 || this.host.weapon() === id) return;
    this.host.setWeapon(id);
    sfx.click();
  }

  cycle(dir: number): void {
    let index = WEAPON_ORDER.indexOf(this.host.weapon());
    for (let step = 0; step < WEAPON_ORDER.length; step += 1) {
      index = (index + dir + WEAPON_ORDER.length) % WEAPON_ORDER.length;
      const next = WEAPON_ORDER[index];
      if (this.host.ammo[next] <= 0) continue;
      this.host.setWeapon(next);
      return;
    }
  }

  shoot(time: number, aim: number): void {
    if (time < this.host.nextShot()) return;
    const weaponId = this.host.weapon();
    const weapon = WEAPONS[weaponId];
    if (this.host.ammo[weaponId] <= 0) {
      sfx.click();
      this.host.setNextShot(time + EMPTY_CLICK_MS);
      this.set("pistol");
      return;
    }
    this.host.setNextShot(time + weapon.cooldown);
    if (Number.isFinite(this.host.ammo[weaponId])) this.host.ammo[weaponId] -= 1;
    this.spawnPellets(time, aim, weapon.pellets, weapon.spread, weapon.speed, weapon.life, weapon.damage);
    WEAPON_SFX[weaponId]();
    this.host.camera().shake(SHAKE_MS, weapon.shake);
    this.host.light.flash = 1;
  }

  private spawnPellets(time: number, aim: number, pellets: number, spread: number, speed: number, life: number, damage: number): void {
    const player = this.host.player();
    const muzzleX = player.x + Math.cos(aim) * MUZZLE_DISTANCE;
    const muzzleY = player.y + Math.sin(aim) * MUZZLE_DISTANCE;
    for (let pellet = 0; pellet < pellets; pellet += 1) {
      const bullet = this.host.bullets().get(muzzleX, muzzleY) as Sprite | null;
      if (!bullet) continue;
      const angle = aim + Phaser.Math.FloatBetween(-spread, spread);
      bullet.enableBody(true, muzzleX, muzzleY, true, true);
      bullet.setDepth(11).setRotation(angle);
      const body = bullet.body as Body;
      body.setCircle(BULLET_RADIUS, 1, 1);
      this.host.physics().velocityFromRotation(angle, speed * Phaser.Math.FloatBetween(0.92, 1.05), body.velocity);
      bullet.setData("dieAt", time + life).setData("dmg", damage);
    }
  }
}
