import { COMBO_CAP, COMBO_WINDOW_MS } from "../config";
import { remainMs } from "../time/remain-ms";

export class Combo {
  count = 0;
  leftMs = 0;

  reset(): void {
    this.count = 0;
    this.leftMs = 0;
  }

  get hudCount(): number {
    return Math.min(COMBO_CAP, this.count);
  }

  get hudLeft(): number {
    if (this.count <= 1) return 0;
    return this.leftMs / COMBO_WINDOW_MS;
  }

  tick(deltaMs: number): void {
    if (this.count === 0) return;
    this.leftMs = remainMs(this.leftMs, deltaMs);
    if (this.leftMs > 0) return;
    this.count = 0;
  }

  note(baseScore: number): { gained: number; mark: boolean } {
    this.count = this.leftMs > 0 ? this.count + 1 : 1;
    this.leftMs = COMBO_WINDOW_MS;
    return {
      gained: baseScore * Math.min(COMBO_CAP, this.count),
      mark: this.count > 1 && this.count % 5 === 0,
    };
  }
}
