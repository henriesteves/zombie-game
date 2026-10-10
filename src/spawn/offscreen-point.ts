import {
  ALARM_SPAWN_SPREAD, SPAWN_DEPTH_MAX, SPAWN_DEPTH_MIN, SPAWN_VIEW_MARGIN,
  VIEW_H, VIEW_W, WORLD_H, WORLD_INSET, WORLD_W,
} from "../config";

export interface SpawnPoint {
  x: number;
  y: number;
}

type ScreenEdge = "left" | "right" | "top" | "bottom";

interface SpawnRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  edge: ScreenEdge;
}

const MIN_RECT = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function offscreenRects(scrollX: number, scrollY: number): SpawnRect[] {
  const left = scrollX - SPAWN_VIEW_MARGIN;
  const top = scrollY - SPAWN_VIEW_MARGIN;
  const right = scrollX + VIEW_W + SPAWN_VIEW_MARGIN;
  const bottom = scrollY + VIEW_H + SPAWN_VIEW_MARGIN;
  const pad = WORLD_INSET;
  const maxX = WORLD_W - pad;
  const maxY = WORLD_H - pad;
  const rects: SpawnRect[] = [];
  if (left > pad) rects.push({ x0: pad, y0: pad, x1: left, y1: maxY, edge: "left" });
  if (right < maxX) rects.push({ x0: right, y0: pad, x1: maxX, y1: maxY, edge: "right" });
  if (top > pad) rects.push({ x0: pad, y0: pad, x1: maxX, y1: top, edge: "top" });
  if (bottom < maxY) rects.push({ x0: pad, y0: bottom, x1: maxX, y1: maxY, edge: "bottom" });
  return rects.filter((rect) => rect.x1 - rect.x0 > MIN_RECT && rect.y1 - rect.y0 > MIN_RECT);
}

function distanceToRect(rect: SpawnRect, point: SpawnPoint): number {
  const x = clamp(point.x, rect.x0, rect.x1);
  const y = clamp(point.y, rect.y0, rect.y1);
  const dx = point.x - x;
  const dy = point.y - y;
  return dx * dx + dy * dy;
}

function closestRect(rects: SpawnRect[], near: SpawnPoint): SpawnRect {
  let best = rects[0];
  let bestDistance = distanceToRect(best, near);
  for (let i = 1; i < rects.length; i++) {
    const distance = distanceToRect(rects[i], near);
    if (distance >= bestDistance) continue;
    best = rects[i];
    bestDistance = distance;
  }
  return best;
}

function inward(origin: number, outside: number, depth: number): number {
  const target = origin + Math.sign(outside - origin) * depth;
  return clamp(target, Math.min(origin, outside), Math.max(origin, outside));
}

function along(min: number, max: number, bias?: number): number {
  if (bias === undefined) return randomBetween(min, max);
  return clamp(bias + randomBetween(-ALARM_SPAWN_SPREAD, ALARM_SPAWN_SPREAD), min, max);
}

function pointOnEdge(rect: SpawnRect, near?: SpawnPoint): SpawnPoint {
  const depth = randomBetween(SPAWN_DEPTH_MIN, SPAWN_DEPTH_MAX);
  if (rect.edge === "left") return { x: inward(rect.x1, rect.x0, depth), y: along(rect.y0, rect.y1, near?.y) };
  if (rect.edge === "right") return { x: inward(rect.x0, rect.x1, depth), y: along(rect.y0, rect.y1, near?.y) };
  if (rect.edge === "top") return { x: along(rect.x0, rect.x1, near?.x), y: inward(rect.y1, rect.y0, depth) };
  return { x: along(rect.x0, rect.x1, near?.x), y: inward(rect.y0, rect.y1, depth) };
}

export function pickOffscreenPoint(scrollX: number, scrollY: number, near?: SpawnPoint): SpawnPoint | null {
  const rects = offscreenRects(scrollX, scrollY);
  if (rects.length === 0) return null;
  const rect = near ? closestRect(rects, near) : rects[Math.floor(Math.random() * rects.length)];
  return pointOnEdge(rect, near);
}
