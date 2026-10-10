import { DASH_COOLDOWN_MS, DASH_MS, DASH_SPEED, PLAYER_SPEED } from "../config";

export interface DashVector {
  x: number;
  y: number;
}

const MOVE_EPSILON = 0.01;

export function dashDirection(moveX: number, moveY: number, aim: number): DashVector {
  const length = Math.hypot(moveX, moveY);
  if (length <= MOVE_EPSILON) return { x: Math.cos(aim), y: Math.sin(aim) };
  return { x: moveX / length, y: moveY / length };
}

export class DashState {
  private remainingMs = 0;
  private cooldownMs = 0;
  private dirX = 1;
  private dirY = 0;
  private spaceHeld = false;
  private padHeld = false;

  get active(): boolean {
    return this.remainingMs > 0;
  }

  reset(): void {
    this.remainingMs = 0;
    this.cooldownMs = 0;
    this.spaceHeld = false;
    this.padHeld = false;
  }

  cancel(): void {
    this.remainingMs = 0;
  }

  takeEdges(spaceDown: boolean, padDown: boolean): boolean {
    const started = (spaceDown && !this.spaceHeld) || (padDown && !this.padHeld);
    this.spaceHeld = spaceDown;
    this.padHeld = padDown;
    return started;
  }

  velocity(deltaMs: number, wantsDash: boolean, moveX: number, moveY: number, aim: number): DashVector {
    if (this.cooldownMs > 0) this.cooldownMs = Math.max(0, this.cooldownMs - deltaMs);
    if (wantsDash) this.tryStart(moveX, moveY, aim);
    if (this.remainingMs <= 0) return { x: moveX * PLAYER_SPEED, y: moveY * PLAYER_SPEED };
    this.remainingMs = Math.max(0, this.remainingMs - deltaMs);
    return { x: this.dirX * DASH_SPEED, y: this.dirY * DASH_SPEED };
  }

  private tryStart(moveX: number, moveY: number, aim: number): void {
    if (this.remainingMs > 0 || this.cooldownMs > 0) return;
    const direction = dashDirection(moveX, moveY, aim);
    this.dirX = direction.x;
    this.dirY = direction.y;
    this.remainingMs = DASH_MS;
    this.cooldownMs = DASH_COOLDOWN_MS;
  }
}
