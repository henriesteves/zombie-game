import Phaser from "phaser";
import {
  SPITTER_COOLDOWN_MS, SPITTER_RANGE, SPITTER_WINDUP_MS, SPIT_DAMAGE, SPIT_LIFE_MS, SPIT_SPAWN_OFFSET, SPIT_SPEED,
} from "../config";
import type { Zombie } from "../entities/Zombie";
import { stepSpitWindup } from "./spit-windup";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;

const SPIT_POOL = 24;
const SPIT_RADIUS = 3;
const WINDUP_TINT = 0xff5ad2;

export class SpitVolley {
  private readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    player: Sprite,
    buildings: Phaser.Physics.Arcade.StaticGroup,
    private readonly hurtPlayer: (damage: number) => void,
  ) {
    this.group = scene.physics.add.group({ defaultKey: "spit", maxSize: SPIT_POOL });
    scene.physics.add.overlap(player, this.group, (_player, spit) => this.hitPlayer(spit as Sprite));
    scene.physics.add.overlap(this.group, buildings, (spit) => {
      (spit as Sprite).disableBody(true, true);
    });
  }

  advance(time: number, deltaMs: number, zombies: Zombie[], player: { x: number; y: number }): void {
    for (const zombie of zombies) {
      if (zombie.kind !== "spitter") continue;
      if (!zombie.active) {
        if (zombie.spitWindupLeft > 0) this.abortWindup(zombie, time);
        continue;
      }
      if (time < zombie.hitUntil) continue;
      this.holdAndSpit(zombie, player, time, deltaMs);
    }
    this.expire(time);
  }

  private holdAndSpit(zombie: Zombie, player: { x: number; y: number }, time: number, deltaMs: number): void {
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const distance = Math.hypot(dx, dy);
    const inRange = distance <= SPITTER_RANGE && distance > 0;
    if (zombie.spitWindupLeft > 0) {
      this.stepWindup(zombie, time, deltaMs, inRange, dx, dy, distance);
      return;
    }
    if (!inRange) return;
    zombie.setVelocity(0, 0);
    zombie.setRotation(Math.atan2(dy, dx));
    if (time < zombie.spitReadyAt) return;
    zombie.spitWindupLeft = SPITTER_WINDUP_MS;
    zombie.setTint(WINDUP_TINT);
  }

  private stepWindup(zombie: Zombie, time: number, deltaMs: number, inRange: boolean, dx: number, dy: number, distance: number): void {
    const step = stepSpitWindup(zombie.spitWindupLeft, deltaMs, zombie.active, inRange);
    if (step.outcome === "abort") {
      this.abortWindup(zombie, time);
      return;
    }
    zombie.setVelocity(0, 0);
    zombie.setRotation(Math.atan2(dy, dx));
    zombie.spitWindupLeft = step.leftMs;
    if (step.outcome === "hold") {
      zombie.setTint(WINDUP_TINT);
      return;
    }
    zombie.clearTint();
    zombie.spitReadyAt = time + SPITTER_COOLDOWN_MS;
    const dirX = dx / distance;
    const dirY = dy / distance;
    this.launch(zombie.x + dirX * SPIT_SPAWN_OFFSET, zombie.y + dirY * SPIT_SPAWN_OFFSET, dirX, dirY, time);
  }

  private abortWindup(zombie: Zombie, time: number): void {
    zombie.spitWindupLeft = 0;
    zombie.spitReadyAt = time + SPITTER_COOLDOWN_MS;
    if (zombie.active) zombie.clearTint();
  }

  private launch(x: number, y: number, dirX: number, dirY: number, time: number): void {
    const spit = this.group.get(x, y) as Sprite | null;
    if (!spit) return;
    spit.enableBody(true, x, y, true, true);
    spit.setDepth(11).setRotation(Math.atan2(dirY, dirX));
    const body = spit.body as Body;
    body.setCircle(SPIT_RADIUS, spit.width / 2 - SPIT_RADIUS, spit.height / 2 - SPIT_RADIUS);
    body.setVelocity(dirX * SPIT_SPEED, dirY * SPIT_SPEED);
    spit.setData("dieAt", time + SPIT_LIFE_MS);
  }

  private hitPlayer(spit: Sprite): void {
    if (!spit.active) return;
    spit.disableBody(true, true);
    this.hurtPlayer(SPIT_DAMAGE);
  }

  private expire(time: number): void {
    for (const child of this.group.getChildren()) {
      const spit = child as Sprite;
      if (!spit.active) continue;
      if (time < (spit.getData("dieAt") as number)) continue;
      spit.disableBody(true, true);
    }
  }
}
