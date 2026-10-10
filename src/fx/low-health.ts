import { LOW_HP_BEAT_MIN_MS, LOW_HP_BEAT_MS, LOW_HP_RATIO } from "../config";

export function lowHealthBeatMs(hp: number, maxHp: number): number | null {
  if (hp <= 0 || maxHp <= 0) return null;
  const ratio = hp / maxHp;
  if (ratio >= LOW_HP_RATIO) return null;
  const urgency = 1 - ratio / LOW_HP_RATIO;
  const interval = LOW_HP_BEAT_MS - (LOW_HP_BEAT_MS - LOW_HP_BEAT_MIN_MS) * urgency;
  return Math.max(LOW_HP_BEAT_MIN_MS, interval);
}
