import Phaser from "phaser";
import { DASH_TRAIL_MS } from "../config";

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

const TRAIL_RADIUS = 7;
const TRAIL_COLOR = 0xd8ecff;

export class DashTrail {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly points: TrailPoint[] = [];

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(11);
  }

  reset(): void {
    this.points.length = 0;
    this.graphics.clear();
  }

  paint(x: number, y: number, deltaMs: number, dashing: boolean): void {
    if (dashing) this.points.push({ x, y, life: DASH_TRAIL_MS });
    this.graphics.clear();
    for (let index = this.points.length - 1; index >= 0; index -= 1) {
      const point = this.points[index];
      point.life -= deltaMs;
      if (point.life <= 0) {
        this.points.splice(index, 1);
        continue;
      }
      const fade = point.life / DASH_TRAIL_MS;
      this.graphics.fillStyle(TRAIL_COLOR, 0.45 * fade);
      this.graphics.fillCircle(point.x, point.y, TRAIL_RADIUS * fade);
    }
  }
}
