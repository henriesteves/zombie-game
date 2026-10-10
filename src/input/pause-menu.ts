import { DEFAULT_VOLUME, readVolume, stepVolume, writeVolume } from "../audio/volume";

export type PauseItem = "resume" | "restart" | "volume";
export const PAUSE_ITEMS: PauseItem[] = ["resume", "restart", "volume"];
export const PAUSE_STICK = 0.5;

export interface PauseInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
}

export interface PauseFrame {
  index: number;
  item: PauseItem;
  volume: number;
  volumeChanged: boolean;
  action: "resume" | "restart" | null;
}

export function movePauseIndex(index: number, dir: number): number {
  const count = PAUSE_ITEMS.length;
  return (index + dir + count) % count;
}

export function pauseMenuLines(index: number, volume: number, bar: (value: number) => string): string {
  const labels = ["continuar", "reiniciar", `volume ${bar(volume)}`];
  return labels.map((label, item) => (item === index ? `> ${label}` : `  ${label}`)).join("\n");
}

export class PauseMenu {
  index = 0;
  volume = DEFAULT_VOLUME;
  private upHeld = false;
  private downHeld = false;
  private leftHeld = false;
  private rightHeld = false;
  private confirmHeld = false;

  reset(): void {
    this.open();
    this.volume = readVolume();
  }

  open(): void {
    this.index = 0;
    this.upHeld = false;
    this.downHeld = false;
    this.leftHeld = false;
    this.rightHeld = false;
    this.confirmHeld = false;
  }

  sample(input: PauseInput): PauseFrame {
    const up = input.up && !this.upHeld;
    const down = input.down && !this.downHeld;
    const left = input.left && !this.leftHeld;
    const right = input.right && !this.rightHeld;
    const confirm = input.confirm && !this.confirmHeld;
    this.upHeld = input.up;
    this.downHeld = input.down;
    this.leftHeld = input.left;
    this.rightHeld = input.right;
    this.confirmHeld = input.confirm;
    if (up) this.index = movePauseIndex(this.index, -1);
    if (down) this.index = movePauseIndex(this.index, 1);
    const item = PAUSE_ITEMS[this.index];
    let volumeChanged = false;
    if (item === "volume" && (left || right)) {
      const next = stepVolume(this.volume, left ? -1 : 1);
      if (next !== this.volume) {
        this.volume = writeVolume(next);
        volumeChanged = true;
      }
    }
    let action: PauseFrame["action"] = null;
    if (confirm && item === "resume") action = "resume";
    if (confirm && item === "restart") action = "restart";
    return { index: this.index, item, volume: this.volume, volumeChanged, action };
  }
}
