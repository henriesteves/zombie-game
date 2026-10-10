import { BLOATER_SWELL_RATIO, BLOATER_SWELL_SCALE } from "../config";

export type BloaterSize = "normal" | "swollen";
export type BloaterSwell = BloaterSize;

/** Returns swollen below the HP threshold while alive, otherwise normal size. */
export function bloaterSize(hp: number, maxHp: number): BloaterSize {
  if (hp <= 0) return "normal";
  if (hp < maxHp * BLOATER_SWELL_RATIO) return "swollen";
  return "normal";
}

export const bloaterSwell = bloaterSize;
export const bloaterSwellState = bloaterSize;

export function isBloaterSwollen(hp: number, maxHp: number): boolean {
  return bloaterSize(hp, maxHp) === "swollen";
}

export function bloaterScale(hp: number, maxHp: number): number {
  return bloaterSize(hp, maxHp) === "swollen" ? BLOATER_SWELL_SCALE : 1;
}
