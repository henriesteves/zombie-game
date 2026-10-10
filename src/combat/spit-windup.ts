export type SpitWindupOutcome = "hold" | "fire" | "abort";

export interface SpitWindupStep {
  leftMs: number;
  outcome: SpitWindupOutcome;
}

/** Advances a spitter's windup. A full windup fires once; leaving range or dying aborts it. */
export function stepSpitWindup(leftMs: number, deltaMs: number, active: boolean, inRange: boolean): SpitWindupStep {
  if (!active || !inRange) return { leftMs: 0, outcome: "abort" };
  const next = leftMs - deltaMs;
  if (next > 0) return { leftMs: next, outcome: "hold" };
  return { leftMs: 0, outcome: "fire" };
}
