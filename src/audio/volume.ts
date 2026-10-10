const VOLUME_KEY = "zombie-game-volume";
export const DEFAULT_VOLUME = 0.5;
export const VOLUME_STEPS = 10;
export const VOLUME_STEP = 1 / VOLUME_STEPS;
const BAR_CELLS = VOLUME_STEPS;

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, value));
}

export function stepVolume(volume: number, dir: number): number {
  if (dir === 0) return clampVolume(volume);
  const cells = Math.round(clampVolume(volume) * VOLUME_STEPS) + Math.sign(dir);
  return Math.max(0, Math.min(VOLUME_STEPS, cells)) / VOLUME_STEPS;
}

export function volumeBar(volume: number): string {
  const filled = Math.round(clampVolume(volume) * BAR_CELLS);
  return "#".repeat(filled) + "-".repeat(BAR_CELLS - filled);
}

export function readVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_KEY);
    if (stored === null) return DEFAULT_VOLUME;
    return clampVolume(Number(stored));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function writeVolume(value: number): number {
  const volume = clampVolume(value);
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    return volume;
  }
  return volume;
}
