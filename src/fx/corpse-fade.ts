import { CORPSE_FADE_START, CORPSE_MS } from "../config";

export type RemovalCause = "kill" | "calm";

const CORPSE_ALPHA = 0.85;

/** Only a real kill leaves a body; a zombie quietly recalled during the calm does not. */
export function leavesCorpse(cause: RemovalCause): boolean {
  return cause === "kill";
}

export function advanceCorpseAge(ageMs: number, deltaMs: number): number {
  return ageMs + Math.max(0, deltaMs);
}

/** Holds steady, then fades to zero across the tail of CORPSE_MS. */
export function corpseAlpha(ageMs: number): number {
  const progress = ageMs / CORPSE_MS;
  if (progress >= 1) return 0;
  if (progress <= CORPSE_FADE_START) return CORPSE_ALPHA;
  return CORPSE_ALPHA * (1 - (progress - CORPSE_FADE_START) / (1 - CORPSE_FADE_START));
}
