import { PAUSE_STICK, type PauseInput } from "./pause-menu";

export interface PauseKeys {
  W: { isDown: boolean };
  A: { isDown: boolean };
  S: { isDown: boolean };
  D: { isDown: boolean };
  UP: { isDown: boolean };
  DOWN: { isDown: boolean };
  LEFT: { isDown: boolean };
  RIGHT: { isDown: boolean };
  ENTER: { isDown: boolean };
}

export interface PausePad {
  A: number | boolean;
  leftStick: { x: number; y: number };
}

export function pauseInputFrom(keys: PauseKeys, pad: PausePad | null): PauseInput {
  const stickY = pad?.leftStick.y ?? 0;
  const stickX = pad?.leftStick.x ?? 0;
  return {
    up: keys.W.isDown || keys.UP.isDown || stickY < -PAUSE_STICK,
    down: keys.S.isDown || keys.DOWN.isDown || stickY > PAUSE_STICK,
    left: keys.A.isDown || keys.LEFT.isDown || stickX < -PAUSE_STICK,
    right: keys.D.isDown || keys.RIGHT.isDown || stickX > PAUSE_STICK,
    confirm: keys.ENTER.isDown || Boolean(pad?.A),
  };
}
