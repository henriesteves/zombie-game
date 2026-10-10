import { KNOCK_MS, KNOCK_SPEED } from "../config";

export interface KnockVector {
  x: number;
  y: number;
}

const ORIGIN_EPSILON = 0.001;

export function knockVelocity(playerX: number, playerY: number, originX: number, originY: number): KnockVector {
  const dx = playerX - originX;
  const dy = playerY - originY;
  const length = Math.hypot(dx, dy);
  if (length < ORIGIN_EPSILON) return { x: KNOCK_SPEED, y: 0 };
  return { x: (dx / length) * KNOCK_SPEED, y: (dy / length) * KNOCK_SPEED };
}

export class PlayerKnock {
  private remainingMs = 0;
  private vx = 0;
  private vy = 0;

  reset(): void {
    this.remainingMs = 0;
    this.vx = 0;
    this.vy = 0;
  }

  replace(playerX: number, playerY: number, originX: number, originY: number): void {
    const velocity = knockVelocity(playerX, playerY, originX, originY);
    this.vx = velocity.x;
    this.vy = velocity.y;
    this.remainingMs = KNOCK_MS;
  }

  velocity(deltaMs: number): KnockVector | null {
    if (this.remainingMs <= 0) return null;
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    return { x: this.vx, y: this.vy };
  }
}
