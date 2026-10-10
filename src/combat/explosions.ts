import Phaser from "phaser";
import * as sfx from "../audio/sfx";
import {
  BARREL_PLAYER_DAMAGE, BARREL_ZOMBIE_DAMAGE, BLAST_STOP_MS, BLOATER_BLAST_RADIUS, BLOATER_PLAYER_DAMAGE,
  BLOATER_ZOMBIE_DAMAGE, CAR_BLAST_HITS, CAR_BLAST_RADIUS, CAR_FIRE_MS, CAR_FIRE_PLAYER_DAMAGE,
  CAR_FIRE_RADIUS, CAR_FIRE_TICK_MS, CAR_FIRE_ZOMBIE_DAMAGE, CAR_HITS, CAR_PLAYER_DAMAGE,
  CAR_ZOMBIE_DAMAGE, EXPLOSION_RADIUS, type PickupKind,
} from "../config";
import type { Zombie } from "../entities/Zombie";
import { isInsideFire } from "./fire-burn";

type Sprite = Phaser.Physics.Arcade.Sprite;

const CAR_CHAIN_DELAY_MS = 160;
const BARREL_CHAIN_DELAY_MS = 110;
const BARREL_CHAIN_REACH = 1.15;
const BARREL_ALARM_REACH = 1.5;
const BLAST_RING_RADIUS = 20;
const BLAST_RING_MS = 300;
const PLAYER_FALLOFF = 0.6;

interface Blast {
  x: number;
  y: number;
  radius: number;
  zombieDamage: number;
  playerDamage: number;
}

export interface Fire {
  x: number;
  y: number;
  life: number;
  max: number;
  sinceBurn: number;
  sprite: Phaser.GameObjects.Image;
}

export interface ExplosionHost {
  damageZombie(zombie: Zombie, damage: number, angle: number): void;
  hurt(damage: number): void;
  holdImpact(ms: number): void;
  addDecal(x: number, y: number, tint: number, scale: number): void;
  spawnPickup(x: number, y: number, kind: PickupKind): void;
  triggerAlarm(car: Sprite): void;
  clearFlow(): void;
  player(): { x: number; y: number };
  zombies(): Zombie[];
  barrels(): Sprite[];
  cars(): Sprite[];
  sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  light: { flash: number };
}

export class Explosions {
  readonly fires: Fire[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly host: ExplosionHost,
  ) {}

  update(delta: number) {
    for (let index = this.fires.length - 1; index >= 0; index -= 1) {
      const fire = this.fires[index];
      fire.life -= delta;
      if (fire.life <= 0) {
        fire.sprite.destroy();
        this.fires.splice(index, 1);
        continue;
      }
      const fade = fire.life / fire.max;
      const flicker = 0.85 + Math.sin(fire.life / 45) * 0.15;
      fire.sprite.setAlpha(fade).setScale((0.8 + fade * 0.7) * flicker);
      fire.sinceBurn += delta;
      if (fire.sinceBurn < CAR_FIRE_TICK_MS) continue;
      fire.sinceBurn -= CAR_FIRE_TICK_MS;
      this.burnAround(fire);
    }
  }

  private burnAround(fire: Fire) {
    for (const zombie of this.host.zombies().slice()) {
      if (!zombie.active) continue;
      if (!isInsideFire(zombie, fire, CAR_FIRE_RADIUS)) continue;
      const angle = Math.atan2(zombie.y - fire.y, zombie.x - fire.x);
      this.host.damageZombie(zombie, CAR_FIRE_ZOMBIE_DAMAGE, angle);
    }
    const player = this.host.player();
    if (!isInsideFire(player, fire, CAR_FIRE_RADIUS)) return;
    this.host.hurt(CAR_FIRE_PLAYER_DAMAGE);
  }

  strikeCar(car: Sprite) {
    this.host.triggerAlarm(car);
    const hits = (car.getData("hits") as number) + 1;
    car.setData("hits", hits);
    if (hits >= CAR_HITS) this.wreckCar(car);
  }

  explodeBarrel(barrel: Sprite) {
    if (!barrel.active) return;
    const { x, y } = barrel;
    barrel.destroy();
    this.playBlast(x, y, EXPLOSION_RADIUS);
    this.applyBlast({ x, y, radius: EXPLOSION_RADIUS, zombieDamage: BARREL_ZOMBIE_DAMAGE, playerDamage: BARREL_PLAYER_DAMAGE });
    this.chainBarrels(x, y, EXPLOSION_RADIUS * BARREL_CHAIN_REACH);
    this.alarmCars(x, y, EXPLOSION_RADIUS * BARREL_ALARM_REACH);
  }

  detonateBloater(x: number, y: number) {
    this.markBloaters(x, y, BLOATER_BLAST_RADIUS);
    this.playBlast(x, y, BLOATER_BLAST_RADIUS);
    this.applyBlast({
      x, y, radius: BLOATER_BLAST_RADIUS, zombieDamage: BLOATER_ZOMBIE_DAMAGE, playerDamage: BLOATER_PLAYER_DAMAGE,
    });
  }

  private wreckCar(car: Sprite) {
    const { x, y } = car;
    car.destroy();
    this.host.clearFlow();
    this.playBlast(x, y, CAR_BLAST_RADIUS);
    this.host.spawnPickup(x, y, Math.random() < 0.5 ? "smg" : "shotgun");
    this.ignite(x, y);
    this.applyBlast({ x, y, radius: CAR_BLAST_RADIUS, zombieDamage: CAR_ZOMBIE_DAMAGE, playerDamage: CAR_PLAYER_DAMAGE });
    this.chainFromBlast(x, y, CAR_BLAST_RADIUS);
  }

  private ignite(x: number, y: number) {
    const sprite = this.scene.add.image(x, y, "flame").setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    this.fires.push({ x, y, life: CAR_FIRE_MS, max: CAR_FIRE_MS, sinceBurn: 0, sprite });
  }

  private playBlast(x: number, y: number, radius: number) {
    this.host.holdImpact(BLAST_STOP_MS);
    sfx.explosion();
    this.scene.cameras.main.shake(320, 0.008 + radius / 18000);
    this.host.light.flash = 1;
    this.host.sparks.explode(Math.round(radius / 4), x, y);
    this.host.addDecal(x, y, 0x222222, radius / 55);
    this.addRing(x, y, radius);
  }

  private addRing(x: number, y: number, radius: number) {
    const ring = this.scene.add.circle(x, y, BLAST_RING_RADIUS, 0xffa030, 0.85).setDepth(18);
    this.scene.tweens.add({
      targets: ring,
      scale: radius / BLAST_RING_RADIUS,
      alpha: 0,
      duration: BLAST_RING_MS,
      onComplete: () => ring.destroy(),
    });
  }

  private applyBlast(blast: Blast) {
    const { x, y, radius, zombieDamage, playerDamage } = blast;
    const reach = radius * radius;
    for (const zombie of this.host.zombies().slice()) {
      if (!zombie.active) continue;
      if (Phaser.Math.Distance.Squared(zombie.x, zombie.y, x, y) >= reach) continue;
      this.host.damageZombie(zombie, zombieDamage, Math.atan2(zombie.y - y, zombie.x - x));
    }
    const player = this.host.player();
    const distance = Phaser.Math.Distance.Between(player.x, player.y, x, y);
    if (distance >= radius) return;
    const falloff = 1 - (distance / radius) * PLAYER_FALLOFF;
    this.host.hurt(Math.round(playerDamage * falloff));
  }

  private chainFromBlast(x: number, y: number, radius: number) {
    this.chainBarrels(x, y, radius);
    for (const car of this.host.cars().slice()) {
      if (!car.active) continue;
      if (Phaser.Math.Distance.Between(car.x, car.y, x, y) > radius) continue;
      this.scene.time.delayedCall(CAR_CHAIN_DELAY_MS, () => this.woundCar(car));
    }
  }

  private chainBarrels(x: number, y: number, radius: number) {
    for (const barrel of this.host.barrels().slice()) {
      if (!barrel.active) continue;
      if (Phaser.Math.Distance.Between(barrel.x, barrel.y, x, y) > radius) continue;
      this.scene.time.delayedCall(BARREL_CHAIN_DELAY_MS, () => this.explodeBarrel(barrel));
    }
  }

  private alarmCars(x: number, y: number, radius: number) {
    for (const car of this.host.cars()) {
      if (!car.active) continue;
      if (Phaser.Math.Distance.Between(car.x, car.y, x, y) > radius) continue;
      this.host.triggerAlarm(car);
    }
  }

  private woundCar(car: Sprite) {
    if (!car.active) return;
    this.host.triggerAlarm(car);
    const hits = (car.getData("hits") as number) + CAR_BLAST_HITS;
    car.setData("hits", hits);
    if (hits >= CAR_HITS) this.wreckCar(car);
  }

  private markBloaters(x: number, y: number, radius: number) {
    const reach = radius * radius;
    for (const zombie of this.host.zombies()) {
      if (!zombie.active || zombie.kind !== "bloater") continue;
      if (Phaser.Math.Distance.Squared(zombie.x, zombie.y, x, y) >= reach) continue;
      zombie.suppressBlast = true;
    }
  }

}
