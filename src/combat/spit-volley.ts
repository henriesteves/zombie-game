import Phaser from "phaser";
import {
  SPITTER_COOLDOWN_MS, SPITTER_RANGE, SPIT_DAMAGE, SPIT_LIFE_MS, SPIT_SPAWN_OFFSET, SPIT_SPEED,
} from "../config";
import type { Zombie } from "../entities/Zombie";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;

const SPIT_POOL = 24;
const SPIT_RADIUS = 3;

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

  advance(time: number, zombies: Zombie[], player: { x: number; y: number }): void {
    for (const zombie of zombies) {
      if (!zombie.active || zombie.kind !== "spitter") continue;
      if (time < zombie.hitUntil) continue;
      this.holdAndSpit(zombie, player, time);
    }
    this.expire(time);
  }

  private holdAndSpit(zombie: Zombie, player: { x: number; y: number }, time: number): void {
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const distance = Math.hypot(dx, dy);
    if (distance > SPITTER_RANGE || distance === 0) return;
    const dirX = dx / distance;
    const dirY = dy / distance;
    zombie.setVelocity(0, 0);
    zombie.setRotation(Math.atan2(dy, dx));
    if (time < zombie.spitReadyAt) return;
    zombie.spitReadyAt = time + SPITTER_COOLDOWN_MS;
    this.launch(zombie.x + dirX * SPIT_SPAWN_OFFSET, zombie.y + dirY * SPIT_SPAWN_OFFSET, dirX, dirY, time);
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
