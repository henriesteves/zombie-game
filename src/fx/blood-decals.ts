import Phaser from "phaser";
import { DECAL_DRY_MS } from "../config";

const MAX_DECALS = 120;
const FRESH_ALPHA = 0.85;
const DRY_ALPHA_LOSS = 0.4;
const FRESH_RED = 120;
const DRY_RED_LOSS = 78;
const BLOOD_TINT = 0xffffff;

export class BloodDecals {
  private readonly decals: Phaser.GameObjects.Image[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  add(x: number, y: number, tint: number, scale: number) {
    const decal = this.takeDecal(x, y);
    decal.setRotation(Math.random() * Math.PI * 2).setScale(scale).setTint(tint).setAlpha(FRESH_ALPHA);
    decal.setData("born", this.scene.time.now).setData("blood", tint === BLOOD_TINT);
    this.decals.push(decal);
  }

  dry(time: number) {
    for (const decal of this.decals) {
      if (!decal.getData("blood")) continue;
      const age = Math.min(1, (time - (decal.getData("born") as number)) / DECAL_DRY_MS);
      const red = Math.round(FRESH_RED - age * DRY_RED_LOSS);
      decal.setTint(Phaser.Display.Color.GetColor(red, Math.round(red * 0.12), Math.round(red * 0.1)));
      decal.setAlpha(FRESH_ALPHA - age * DRY_ALPHA_LOSS);
    }
  }

  private takeDecal(x: number, y: number): Phaser.GameObjects.Image {
    if (this.decals.length < MAX_DECALS) return this.scene.add.image(x, y, "splat").setDepth(1);
    const oldest = this.decals.shift()!;
    oldest.setPosition(x, y);
    return oldest;
  }
}
