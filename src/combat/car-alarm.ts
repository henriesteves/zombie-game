import { ALARM_BLINK_MS } from "../config";
import { isExpired, remainMs } from "../time/remain-ms";

const ALARM_ON_TINT = 0xff7070;
const ALARM_OFF_TINT = 0xffffff;

export interface AlarmFrame {
  left: number;
  blink: number;
  tint: number | null;
}

export function tickCarAlarm(left: number, blink: number, deltaMs: number): AlarmFrame {
  const next = remainMs(left, deltaMs);
  if (isExpired(next)) return { left: 0, blink: 0, tint: null };
  const nextBlink = blink + deltaMs;
  const on = Math.floor(nextBlink / ALARM_BLINK_MS) % 2 === 0;
  return { left: next, blink: nextBlink, tint: on ? ALARM_ON_TINT : ALARM_OFF_TINT };
}
