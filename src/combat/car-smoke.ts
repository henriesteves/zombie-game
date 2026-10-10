import { CAR_HITS, CAR_SMOKE_HITS } from "../config";

export type CarHitEffect = "intact" | "smoke" | "wreck";

export function carHitEffect(hits: number): CarHitEffect {
  if (hits >= CAR_HITS) return "wreck";
  if (hits >= CAR_SMOKE_HITS) return "smoke";
  return "intact";
}
