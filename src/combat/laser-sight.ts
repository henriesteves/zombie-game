import Phaser from "phaser";
import { LASER_DOT_RADIUS, LASER_MUZZLE, LASER_WIDTH } from "../config";
import { traceLaser, type LaserBlockers, type LaserPoint } from "./laser-ray";

const LASER_COLOR = 0xff2a2a;

export function drawLaserSight(
  graphics: Phaser.GameObjects.Graphics,
  origin: LaserPoint & { rotation: number },
  blockers: LaserBlockers,
) {
  const aim = origin.rotation;
  const cos = Math.cos(aim);
  const sin = Math.sin(aim);
  const start = { x: origin.x + cos * LASER_MUZZLE, y: origin.y + sin * LASER_MUZZLE };
  const end = traceLaser(start, { x: cos, y: sin }, blockers);
  graphics.clear();
  graphics.lineStyle(LASER_WIDTH, LASER_COLOR, 1);
  graphics.lineBetween(start.x, start.y, end.x, end.y);
  graphics.fillStyle(LASER_COLOR, 1);
  graphics.fillCircle(end.x, end.y, LASER_DOT_RADIUS);
}
