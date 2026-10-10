export function remainMs(leftMs: number, deltaMs: number): number {
  return Math.max(0, leftMs - deltaMs);
}

export function isExpired(leftMs: number): boolean {
  return leftMs <= 0;
}
