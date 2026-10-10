import { HORDE_PLAYER_PUSH_MAX, HORDE_PLAYER_PUSH_RADIUS } from "../config";

export interface PushVector {
  x: number;
  y: number;
}

/** Outward shove for a zombie near the player: zero outside the radius, capped at the center. */
export function playerPush(zombieX: number, zombieY: number, playerX: number, playerY: number): PushVector {
  const dx = zombieX - playerX;
  const dy = zombieY - playerY;
  const distance = Math.hypot(dx, dy);
  if (distance >= HORDE_PLAYER_PUSH_RADIUS) return { x: 0, y: 0 };
  const strength = HORDE_PLAYER_PUSH_MAX * (1 - distance / HORDE_PLAYER_PUSH_RADIUS);
  if (distance === 0) return { x: strength, y: 0 };
  return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}
