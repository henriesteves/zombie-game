export const WALK_STEP_MS = 160;
export const WALK_MIN_SPEED = 12;

const WALK_AGE_KEY = "walkAge";

interface WalkBody {
  velocity: { x: number; y: number };
}

interface WalkSprite {
  getData(key: string): unknown;
  setData(key: string, value: number): unknown;
  texture: { key: string };
  setTexture(key: string): unknown;
  body: WalkBody | null;
}

export function isWalking(speed: number): boolean {
  return speed >= WALK_MIN_SPEED;
}

export function walkAge(ageMs: number, deltaMs: number, moving: boolean): number {
  if (!moving) return 0;
  return ageMs + deltaMs;
}

export function walkTexture(base: string, ageMs: number): string {
  const stepping = Math.floor(ageMs / WALK_STEP_MS) % 2 === 1;
  if (!stepping) return base;
  return `${base}_step`;
}

export function deadTexture(base: string): string {
  return `${base}_dead`;
}

export function syncWalk(sprite: WalkSprite, base: string, deltaMs: number): void {
  const velocity = sprite.body?.velocity;
  const speed = velocity ? Math.hypot(velocity.x, velocity.y) : 0;
  const age = walkAge(Number(sprite.getData(WALK_AGE_KEY) ?? 0), deltaMs, isWalking(speed));
  sprite.setData(WALK_AGE_KEY, age);
  const key = walkTexture(base, age);
  if (sprite.texture.key === key) return;
  sprite.setTexture(key);
}
