import Phaser from "phaser";
import { advanceCorpseAge, corpseAlpha, leavesCorpse, type RemovalCause } from "./corpse-fade";

interface Corpse {
  image: Phaser.GameObjects.Image;
  age: number;
}

const MAX_CORPSES = 60;
const CORPSE_DEPTH = 3;
const CORPSE_TINT = 0x5a4a44;

/** Physics-free bodies left where zombies die. They fade on world time only. */
export class Corpses {
  private readonly corpses: Corpse[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  leave(zombie: Phaser.GameObjects.Sprite, cause: RemovalCause): void {
    if (!leavesCorpse(cause)) return;
    const corpse = this.take();
    corpse.image.setTexture(zombie.texture.key).setPosition(zombie.x, zombie.y);
    corpse.image.setRotation(zombie.rotation + Math.PI / 2).setScale(1).setTint(CORPSE_TINT);
    corpse.image.setDepth(CORPSE_DEPTH).setAlpha(corpseAlpha(0)).setVisible(true);
    corpse.age = 0;
    this.corpses.push(corpse);
  }

  advance(deltaMs: number): void {
    for (let index = this.corpses.length - 1; index >= 0; index -= 1) {
      const corpse = this.corpses[index];
      corpse.age = advanceCorpseAge(corpse.age, deltaMs);
      const alpha = corpseAlpha(corpse.age);
      if (alpha <= 0) {
        corpse.image.destroy();
        this.corpses.splice(index, 1);
        continue;
      }
      corpse.image.setAlpha(alpha);
    }
  }

  private take(): Corpse {
    if (this.corpses.length < MAX_CORPSES) return { image: this.scene.add.image(0, 0, "zombie_walker"), age: 0 };
    return this.corpses.shift()!;
  }
}
