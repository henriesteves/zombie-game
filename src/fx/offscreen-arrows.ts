import { OFFSCREEN_ARROW_CAP, OFFSCREEN_ARROW_INSET, VIEW_H, VIEW_W } from "../config";

export interface ThreatPoint {
  x: number;
  y: number;
}

export interface ScreenArrow {
  x: number;
  y: number;
  angle: number;
}

interface ArrowView {
  threats: ThreatPoint[];
  scrollX: number;
  scrollY: number;
  viewWidth: number;
  viewHeight: number;
  inset: number;
  cap: number;
}

const AXIS_EPSILON = 0.001;
const ARROW_BACK_RATIO = 0.65;

export function selectOffscreenArrows(view: ArrowView): ScreenArrow[] {
  const centerX = view.viewWidth / 2;
  const centerY = view.viewHeight / 2;
  const ranked: { arrow: ScreenArrow; distance: number }[] = [];
  for (const threat of view.threats) {
    const screenX = threat.x - view.scrollX;
    const screenY = threat.y - view.scrollY;
    const arrow = edgeArrow(screenX, screenY, view.viewWidth, view.viewHeight, view.inset);
    if (!arrow) continue;
    const dx = screenX - centerX;
    const dy = screenY - centerY;
    ranked.push({ arrow, distance: dx * dx + dy * dy });
  }
  ranked.sort((left, right) => left.distance - right.distance);
  return ranked.slice(0, view.cap).map((entry) => entry.arrow);
}

export function hudArrows(threats: ThreatPoint[], scrollX: number, scrollY: number): ScreenArrow[] {
  return selectOffscreenArrows({
    threats, scrollX, scrollY,
    viewWidth: VIEW_W, viewHeight: VIEW_H,
    inset: OFFSCREEN_ARROW_INSET, cap: OFFSCREEN_ARROW_CAP,
  });
}

export function arrowTriangle(arrow: ScreenArrow, length: number, halfWidth: number): number[] {
  const cos = Math.cos(arrow.angle);
  const sin = Math.sin(arrow.angle);
  const back = length * ARROW_BACK_RATIO;
  const sideX = -sin;
  const sideY = cos;
  return [
    arrow.x + cos * length, arrow.y + sin * length,
    arrow.x - cos * back + sideX * halfWidth, arrow.y - sin * back + sideY * halfWidth,
    arrow.x - cos * back - sideX * halfWidth, arrow.y - sin * back - sideY * halfWidth,
  ];
}

function edgeArrow(screenX: number, screenY: number, viewWidth: number, viewHeight: number, inset: number): ScreenArrow | null {
  if (screenX >= 0 && screenY >= 0 && screenX <= viewWidth && screenY <= viewHeight) return null;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const dx = screenX - centerX;
  const dy = screenY - centerY;
  const halfW = viewWidth / 2 - inset;
  const halfH = viewHeight / 2 - inset;
  const scaleX = Math.abs(dx) < AXIS_EPSILON ? Number.POSITIVE_INFINITY : halfW / Math.abs(dx);
  const scaleY = Math.abs(dy) < AXIS_EPSILON ? Number.POSITIVE_INFINITY : halfH / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return { x: centerX + dx * scale, y: centerY + dy * scale, angle: Math.atan2(dy, dx) };
}
