import Phaser from "phaser";
import { LASER_BARREL_RADIUS, LASER_DOT_RADIUS, LASER_MUZZLE, LASER_RANGE, LASER_STEP, LASER_WIDTH, ZOMBIES } from "../config";
import type { Zombie } from "../entities/Zombie";

interface LaserPoint {
  x: number;
  y: number;
}

interface LaserBox extends LaserPoint {
  active: boolean;
  displayWidth: number;
  displayHeight: number;
}

interface LaserBarrel extends LaserPoint {
  active: boolean;
}

export interface LaserBlockers {
  buildings: LaserBox[];
  cars: LaserBox[];
  barrels: LaserBarrel[];
  zombies: Zombie[];
}

const LASER_COLOR = 0xff2a2a;

export function drawLaserSight(
  graphics: Phaser.GameObjects.Graphics,
  origin: LaserPoint & { rotation: number },
  blockers: LaserBlockers,
) {
  const aim = origin.rotation;
  const cos = Math.cos(aim);
  const sin = Math.sin(aim);
  const startX = origin.x + cos * LASER_MUZZLE;
  const startY = origin.y + sin * LASER_MUZZLE;
  const end = traceLaser(startX, startY, cos, sin, blockers);
  graphics.clear();
  graphics.lineStyle(LASER_WIDTH, LASER_COLOR, 1);
  graphics.lineBetween(startX, startY, end.x, end.y);
  graphics.fillStyle(LASER_COLOR, 1);
  graphics.fillCircle(end.x, end.y, LASER_DOT_RADIUS);
}

function traceLaser(startX: number, startY: number, cos: number, sin: number, blockers: LaserBlockers): LaserPoint {
  let x = startX;
  let y = startY;
  for (let traveled = 0; traveled <= LASER_RANGE; traveled += LASER_STEP) {
    x = startX + cos * traveled;
    y = startY + sin * traveled;
    if (laserBlocked(x, y, blockers)) return { x, y };
  }
  return { x, y };
}

function laserBlocked(x: number, y: number, blockers: LaserBlockers): boolean {
  for (const building of blockers.buildings) {
    if (spriteCovers(building, x, y)) return true;
  }
  for (const car of blockers.cars) {
    if (car.active && spriteCovers(car, x, y)) return true;
  }
  for (const barrel of blockers.barrels) {
    if (barrel.active && Math.hypot(barrel.x - x, barrel.y - y) <= LASER_BARREL_RADIUS) return true;
  }
  for (const zombie of blockers.zombies) {
    if (!zombie.active) continue;
    if (Math.hypot(zombie.x - x, zombie.y - y) <= ZOMBIES[zombie.kind].radius) return true;
  }
  return false;
}

function spriteCovers(sprite: LaserBox, x: number, y: number): boolean {
  const halfW = sprite.displayWidth * 0.5;
  const halfH = sprite.displayHeight * 0.5;
  return Math.abs(x - sprite.x) <= halfW && Math.abs(y - sprite.y) <= halfH;
}
