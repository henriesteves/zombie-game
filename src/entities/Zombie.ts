import Phaser from "phaser";
import { ZOMBIES, type ZombieKind } from "../config";

/** Zumbi reutilizável (object pooling): use group.get() e depois spawn(). */
export class Zombie extends Phaser.Physics.Arcade.Sprite {
  kind: ZombieKind = "walker";
  hp = 1;
  speed = 60;
  damage = 5;
  hitUntil = 0; // enquanto > agora: pisca branco e sofre knockback
  stuckMs = 0;
  side = 1; // lado preferido para contornar obstáculos
  wobble = 0;
  sepX = 0; // força de separação acumulada (evita a horda virar um blob)
  sepY = 0;

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
    this.stuckMs = 0;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.wobble = Math.random() * Math.PI * 2;

    this.setTexture(def.texture);
    this.setDepth(10);
    this.enableBody(true, x, y, true, true);
    this.clearTint();
    const r = def.radius;
    (this.body as Phaser.Physics.Arcade.Body).setCircle(r, this.width / 2 - r, this.height / 2 - r);
    return this;
  }
}
