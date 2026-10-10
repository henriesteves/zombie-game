import { ALARM_BLINK_MS } from "../config";
import { isExpired, remainMs } from "../time/remain-ms";

const ALARM_ON_TINT = 0xff7070;
const ALARM_OFF_TINT = 0xffffff;

export interface AlarmFrame {
  left: number;
  blink: number;
  tint: number | null;
}

export interface AlarmTarget {
  getData(key: string): unknown;
  setData(key: string, value: unknown): unknown;
  setTint(tint: number): unknown;
  clearTint(): void;
}

export function paintCarAlarms(cars: AlarmTarget[], deltaMs: number): void {
  for (const car of cars) {
    const frame = tickCarAlarm(readAlarm(car, "alarmLeft"), readAlarm(car, "alarmBlink"), deltaMs);
    car.setData("alarmLeft", frame.left);
    car.setData("alarmBlink", frame.blink);
    paintAlarmTint(car, frame.tint);
  }
}

function readAlarm(car: AlarmTarget, key: string): number {
  return (car.getData(key) as number) || 0;
}

function paintAlarmTint(car: AlarmTarget, tint: number | null): void {
  if (tint !== null) {
    car.setTint(tint);
    car.setData("blink", true);
    return;
  }
  if (!car.getData("blink")) return;
  car.clearTint();
  car.setData("blink", false);
}

export function tickCarAlarm(left: number, blink: number, deltaMs: number): AlarmFrame {
  const next = remainMs(left, deltaMs);
  if (isExpired(next)) return { left: 0, blink: 0, tint: null };
  const nextBlink = blink + deltaMs;
  const on = Math.floor(nextBlink / ALARM_BLINK_MS) % 2 === 0;
  return { left: next, blink: nextBlink, tint: on ? ALARM_ON_TINT : ALARM_OFF_TINT };
}
