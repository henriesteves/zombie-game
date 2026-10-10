import Phaser from "phaser";
import { SCORE_POPUP_MS, SCORE_POPUP_RISE } from "../config";

interface ScoreLabel {
  text: Phaser.GameObjects.Text;
  life: number;
}

const POPUP_DEPTH = 30;

export class ScorePopups {
  private readonly labels: ScoreLabel[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(x: number, y: number, points: number): void {
    const text = this.scene.add.text(x, y, `+${points}`, {
      fontFamily: "monospace", fontSize: "16px", color: "#f2efe4",
    }).setOrigin(0.5).setDepth(POPUP_DEPTH);
    this.labels.push({ text, life: SCORE_POPUP_MS });
  }

  advance(deltaMs: number): void {
    for (let index = this.labels.length - 1; index >= 0; index -= 1) {
      const label = this.labels[index];
      label.life -= deltaMs;
      if (label.life <= 0) {
        label.text.destroy();
        this.labels.splice(index, 1);
        continue;
      }
      label.text.y -= deltaMs * SCORE_POPUP_RISE;
      label.text.setAlpha(label.life / SCORE_POPUP_MS);
    }
  }
}
