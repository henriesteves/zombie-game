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

const CAR_SLIDE = 140;
const BARREL_NUDGE = 70;
const LAMP_NUDGE = 36;
const PROP_CENTER_CLEAR = 200;

export interface StreetProps {
  cars: StreetPoint[];
  barrels: StreetPoint[];
  lamps: StreetPoint[];
}

export function placeStreetProps(roll: () => number): StreetProps {
  return {
    cars: curbCars().map((point) => slideAlongCurb(point, roll)),
    barrels: streetBarrels().map((point) => nudgeOnStreet(point, roll, BARREL_NUDGE)),
    lamps: streetLamps().map((point) => nudgeOnStreet(point, roll, LAMP_NUDGE)),
  };
}

function slideAlongCurb(point: StreetPoint, roll: () => number): StreetPoint {
  return { x: point.x, y: clampStreetY(point.y + (roll() - 0.5) * CAR_SLIDE) };
}

function nudgeOnStreet(point: StreetPoint, roll: () => number, reach: number): StreetPoint {
  const x = clamp(point.x + (roll() - 0.5) * reach * 2, STREET_LEFT + 64, STREET_RIGHT - 64);
  const y = clampStreetY(point.y + (roll() - 0.5) * reach * 2);
  const centerX = WORLD_W / 2;
  const centerY = WORLD_H / 2;
  if (Math.hypot(x - centerX, y - centerY) < PROP_CENTER_CLEAR) return point;
  return { x, y };
}

function clampStreetY(y: number): number {
  return clamp(y, 110, WORLD_H - 110);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
