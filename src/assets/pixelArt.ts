import Phaser from "phaser";
import type { Palette } from "./pixel-frames";

export function makeTexture(scene: Phaser.Scene, key: string, rows: string[], palette: Palette, scale = 3) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, w * scale, h * scale)!;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  tex.refresh();
}
