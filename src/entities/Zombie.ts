import Phaser from "phaser";
import { ZOMBIES, type ZombieCharge, type ZombieKind } from "../config";
import { bloaterScale } from "../combat/bloater-swell";

export type ChargeStep = "start" | "hold" | "dash";

type ChargeState = "idle" | "windup" | "dash";

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  kind: ZombieKind = "walker";
  hp = 1;
  speed = 60;
  damage = 5;
  hitUntil = 0;
  wobble = 0;
  sepX = 0;
  sepY = 0;
  suppressBlast = false;
  chargeState: ChargeState = "idle";
  chargeUntil = 0;
  chargeReadyAt = 0;
  chargeX = 1;
  chargeY = 0;
  spitReadyAt = 0;
  spitWindupLeft = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "zombie_walker");
  }

  spawn(kind: ZombieKind, x: number, y: number) {
    const def = ZOMBIES[kind];
    this.kind = kind;
    this.hp = def.hp;
    this.speed = def.speed * Phaser.Math.FloatBetween(0.9, 1.1);
    this.damage = def.damage;
    this.hitUntil = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.suppressBlast = false;
    this.chargeState = "idle";
    this.chargeUntil = 0;
    this.chargeReadyAt = 0;
    this.spitReadyAt = 0;
    this.spitWindupLeft = 0;
    this.setScale(1);
    this.setTexture(def.texture);
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

  interruptCharge(time: number) {
    if (this.chargeState === "idle") return;
    const charge = ZOMBIES[this.kind].charge;
    this.chargeState = "idle";
    this.setScale(1);
    if (charge) this.chargeReadyAt = time + charge.cooldownMs;
  }

  advanceCharge(time: number, playerX: number, playerY: number): ChargeStep | null {
    const charge = ZOMBIES[this.kind].charge;
    if (!charge) return null;
    if (this.chargeState === "dash") return this.stepDash(time, charge);
    if (this.chargeState === "windup") return this.stepWindup(time, charge, playerX, playerY);
    return this.tryWindup(time, charge, playerX, playerY);
  }

  private stepDash(time: number, charge: ZombieCharge): ChargeStep | null {
    if (time >= this.chargeUntil) {
      this.chargeState = "idle";
      this.chargeReadyAt = time + charge.cooldownMs;
      this.setScale(1);
      this.clearTint();
      return null;
    }
    this.setVelocity(this.chargeX * charge.speed, this.chargeY * charge.speed);
    this.setRotation(Math.atan2(this.chargeY, this.chargeX));
    this.setTint(0xff3318);
    return "dash";
  }

  private stepWindup(time: number, charge: ZombieCharge, playerX: number, playerY: number): ChargeStep {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    this.setRotation(Math.atan2(dy, dx));
    this.setVelocity(0, 0);
    this.setTint(Math.floor(time / 70) % 2 ? 0xff8844 : 0xff2200);
    if (time < this.chargeUntil) return "hold";
    const length = Math.hypot(dx, dy) || 1;
    this.chargeX = dx / length;
    this.chargeY = dy / length;
    this.chargeState = "dash";
    this.chargeUntil = time + charge.dashMs;
    this.setScale(1);
    this.setVelocity(this.chargeX * charge.speed, this.chargeY * charge.speed);
    return "dash";
  }

  private tryWindup(time: number, charge: ZombieCharge, playerX: number, playerY: number): ChargeStep | null {
    if (time < this.chargeReadyAt) return null;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    if (dx * dx + dy * dy > charge.range * charge.range) return null;
    this.chargeState = "windup";
    this.chargeUntil = time + charge.windupMs;
    this.setScale(1.12);
    this.setVelocity(0, 0);
    return "start";
  }
}
