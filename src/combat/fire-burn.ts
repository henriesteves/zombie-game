export interface BurnPoint {
  x: number;
  y: number;
}

export function isInsideFire(point: BurnPoint, fire: BurnPoint, radius: number): boolean {
  const dx = point.x - fire.x;
  const dy = point.y - fire.y;
  return dx * dx + dy * dy < radius * radius;
}
