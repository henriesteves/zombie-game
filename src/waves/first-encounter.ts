import { ENCOUNTER_BANNER_MS, type ZombieKind } from "../config";
import { remainMs } from "../time/remain-ms";

const HINTS: Partial<Record<ZombieKind, string>> = {
  brute: "BRUTE — recua e investe",
  spitter: "CUSPIDOR — cospe de longe",
};

export class FirstEncounter {
  line = "";
  private leftMs = 0;
  private readonly seen = new Set<ZombieKind>();

  reset(): void {
    this.line = "";
    this.leftMs = 0;
    this.seen.clear();
  }

  noteKind(kind: ZombieKind): void {
    const hint = HINTS[kind];
    if (!hint) return;
    if (this.seen.has(kind)) return;
    this.seen.add(kind);
    this.line = hint;
    this.leftMs = ENCOUNTER_BANNER_MS;
  }

  tick(deltaMs: number): void {
    if (this.leftMs <= 0) return;
    this.leftMs = remainMs(this.leftMs, deltaMs);
    if (this.leftMs > 0) return;
    this.line = "";
  }
}
