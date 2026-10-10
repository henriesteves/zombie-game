import { LASER_BARREL_RADIUS, LASER_RANGE, ZOMBIES, type ZombieKind } from "../config";

export interface LaserPoint {
  x: number;
  y: number;
}

export interface LaserBox extends LaserPoint {
  active: boolean;
  displayWidth: number;
  displayHeight: number;
}

export interface LaserBarrel extends LaserPoint {
  active: boolean;
}

export interface LaserZombie extends LaserPoint {
  active: boolean;
  kind: ZombieKind;
}

export interface LaserBlockers {
  buildings: LaserBox[];
  cars: LaserBox[];
  barrels: LaserBarrel[];
  zombies: LaserZombie[];
}

export function traceLaser(origin: LaserPoint, dir: LaserPoint, blockers: LaserBlockers): LaserPoint {
  let nearest = LASER_RANGE;
  for (const building of blockers.buildings) {
    nearest = closerHit(nearest, hitDistanceToBox(origin, dir, building));
  }
  for (const car of blockers.cars) {
    if (!car.active) continue;
    nearest = closerHit(nearest, hitDistanceToBox(origin, dir, car));
  }
  for (const barrel of blockers.barrels) {
    if (!barrel.active) continue;
    nearest = closerHit(nearest, hitDistanceToCircle(origin, dir, { x: barrel.x, y: barrel.y, radius: LASER_BARREL_RADIUS }));
  }
  for (const zombie of blockers.zombies) {
    if (!zombie.active) continue;
    nearest = closerHit(nearest, hitDistanceToCircle(origin, dir, { x: zombie.x, y: zombie.y, radius: ZOMBIES[zombie.kind].radius }));
  }
  return { x: origin.x + dir.x * nearest, y: origin.y + dir.y * nearest };
}

function closerHit(nearest: number, hit: number | null): number {
  if (hit === null || hit >= nearest) return nearest;
  return hit;
}

function hitDistanceToBox(origin: LaserPoint, dir: LaserPoint, box: LaserBox): number | null {
  const minX = box.x - box.displayWidth * 0.5;
  const maxX = box.x + box.displayWidth * 0.5;
  const minY = box.y - box.displayHeight * 0.5;
  const maxY = box.y + box.displayHeight * 0.5;
  let tEnter = Number.NEGATIVE_INFINITY;
  let tExit = Number.POSITIVE_INFINITY;
  const xHit = slabRange(origin.x, dir.x, minX, maxX);
  if (!xHit) return null;
  tEnter = Math.max(tEnter, xHit.enter);
  tExit = Math.min(tExit, xHit.exit);
  if (tEnter > tExit) return null;
  const yHit = slabRange(origin.y, dir.y, minY, maxY);
  if (!yHit) return null;
  tEnter = Math.max(tEnter, yHit.enter);
  tExit = Math.min(tExit, yHit.exit);
  if (tEnter > tExit || tExit < 0) return null;
  if (tEnter < 0) return 0;
  return tEnter;
}

function slabRange(origin: number, dir: number, min: number, max: number): { enter: number; exit: number } | null {
  if (dir === 0) {
    if (origin < min || origin > max) return null;
    return { enter: Number.NEGATIVE_INFINITY, exit: Number.POSITIVE_INFINITY };
  }
  const inv = 1 / dir;
  const t1 = (min - origin) * inv;
  const t2 = (max - origin) * inv;
  if (t1 < t2) return { enter: t1, exit: t2 };
  return { enter: t2, exit: t1 };
}

function hitDistanceToCircle(origin: LaserPoint, dir: LaserPoint, circle: LaserPoint & { radius: number }): number | null {
  const offsetX = origin.x - circle.x;
  const offsetY = origin.y - circle.y;
  const c = offsetX * offsetX + offsetY * offsetY - circle.radius * circle.radius;
  if (c <= 0) return 0;
  const b = offsetX * dir.x + offsetY * dir.y;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0) return null;
  return t;
}
