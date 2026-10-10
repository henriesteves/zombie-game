import Phaser from "phaser";
import { ZOMBIES, type ZombieKind } from "../config";
import { bloaterScale } from "../combat/bloater-swell";
import { ChargeClock, type ChargeStep } from "../combat/charge-clock";

export type { ChargeStep };

const CHARGE_WINDUP_BLINK_MS = 70;
const CHARGE_DASH_TINT = 0xff3318;
const CHARGE_WINDUP_TINT_A = 0xff8844;
const CHARGE_WINDUP_TINT_B = 0xff2200;
const CHARGE_WINDUP_SCALE = 1.12;

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  kind: ZombieKind = "walker";
  hp = 1;
  speed = 60;
  damage = 5;
  hitLeft = 0;
  wobble = 0;
  sepX = 0;
  sepY = 0;
  suppressBlast = false;
  chargeX = 1;
  chargeY = 0;
  spitCooldownLeft = 0;
  spitWindupLeft = 0;
  private readonly chargeClock = new ChargeClock();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "zombie_walker");
  }

  spawn(kind: ZombieKind, x: number, y: number) {
    const def = ZOMBIES[kind];
    this.kind = kind;
    this.hp = def.hp;
    this.speed = def.speed * Phaser.Math.FloatBetween(0.9, 1.1);
    this.damage = def.damage;
    this.hitLeft = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.suppressBlast = false;
    this.chargeClock.reset();
    this.spitCooldownLeft = 0;
    this.spitWindupLeft = 0;
    this.setScale(1);
    this.setTexture(def.texture);
    this.setData("walkAge", 0);
    this.setDepth(10);
    this.enableBody(true, x, y, true, true);
    this.clearTint();
    const radius = def.radius;
    (this.body as Phaser.Physics.Arcade.Body).setCircle(radius, this.width / 2 - radius, this.height / 2 - radius);
    return this;
  }

  syncSwell(): void {
    if (this.kind !== "bloater") return;
    this.setScale(this.hp > 0 ? bloaterScale(this.hp, ZOMBIES.bloater.hp) : 1);
  }

  tickChargeCooldown(deltaMs: number): void {
    this.chargeClock.tickCooldown(deltaMs);
  }

  interruptCharge() {
    const charge = ZOMBIES[this.kind].charge;
    if (!this.chargeClock.interrupt(charge ? charge.cooldownMs : 0)) return;
    this.setScale(1);
  }

  advanceCharge(deltaMs: number, playerX: number, playerY: number): ChargeStep | null {
    const charge = ZOMBIES[this.kind].charge;
    if (!charge) return null;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const previous = this.chargeClock.state;
    const inRange = dx * dx + dy * dy <= charge.range * charge.range;
    const step = this.chargeClock.advance(deltaMs, inRange, charge);
    if (previous === "dash" && !step) {
      this.setScale(1);
      this.clearTint();
      return null;
    }
    if (step === "start") {
      this.setScale(CHARGE_WINDUP_SCALE);
      this.setVelocity(0, 0);
      return "start";
    }
    if (step === "hold") {
      this.setRotation(Math.atan2(dy, dx));
      this.setVelocity(0, 0);
      this.setTint(Math.floor(this.chargeClock.leftMs / CHARGE_WINDUP_BLINK_MS) % 2 ? CHARGE_WINDUP_TINT_A : CHARGE_WINDUP_TINT_B);
      return "hold";
    }
    if (step !== "dash") return null;
    if (previous === "windup") {
      const length = Math.hypot(dx, dy) || 1;
      this.chargeX = dx / length;
      this.chargeY = dy / length;
      this.setScale(1);
    }
    this.setVelocity(this.chargeX * charge.speed, this.chargeY * charge.speed);
    this.setRotation(Math.atan2(this.chargeY, this.chargeX));
    this.setTint(CHARGE_DASH_TINT);
    return "dash";
  }
}
