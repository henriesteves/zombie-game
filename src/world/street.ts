import {
  BUILDING_BLOCK_H, BUILDING_GAP, STREET_LEFT, STREET_RIGHT, WORLD_H, WORLD_W,
} from "../config";

export interface StreetBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StreetPoint {
  x: number;
  y: number;
}

const SPAWN_CLEAR = 240;

export function streetBlocks(): StreetBlock[] {
  const blocks: StreetBlock[] = [];
  const rightWidth = WORLD_W - STREET_RIGHT;
  let top = 0;
  while (top < WORLD_H - 80) {
    const height = Math.min(BUILDING_BLOCK_H, WORLD_H - top);
    blocks.push({ x: STREET_LEFT / 2, y: top + height / 2, width: STREET_LEFT, height });
    blocks.push({ x: STREET_RIGHT + rightWidth / 2, y: top + height / 2, width: rightWidth, height });
    top += height + BUILDING_GAP;
  }
  return blocks;
}

export function curbCars(): StreetPoint[] {
  const cars: StreetPoint[] = [];
  const left = STREET_LEFT + 86;
  const right = STREET_RIGHT - 86;
  const centerX = WORLD_W / 2;
  const centerY = WORLD_H / 2;
  for (let y = 150; y < WORLD_H - 100; y += 220) {
    if (Math.hypot(left - centerX, y - centerY) >= SPAWN_CLEAR) cars.push({ x: left, y });
    const rightY = y + 100;
    if (rightY > WORLD_H - 80) continue;
    if (Math.hypot(right - centerX, rightY - centerY) >= SPAWN_CLEAR) cars.push({ x: right, y: rightY });
  }
  return cars;
}

export function streetBarrels(): StreetPoint[] {
  const barrels: StreetPoint[] = [];
  const centerX = WORLD_W / 2;
  const centerY = WORLD_H / 2;
  for (let index = 0; index < 6; index++) {
    const y = 220 + index * 210;
    const x = centerX + (index % 2 === 0 ? -150 : 170);
    if (Math.hypot(x - centerX, y - centerY) < 200) continue;
    barrels.push({ x, y });
  }
  return barrels;
}

export function streetLamps(): StreetPoint[] {
  return [
    { x: WORLD_W / 2, y: 280 },
    { x: WORLD_W / 2, y: 620 },
    { x: WORLD_W / 2, y: 1080 },
    { x: WORLD_W / 2, y: 1400 },
  ];
}
