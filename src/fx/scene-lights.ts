import type { SceneLight } from "./FlashlightPipeline";

const FIRE_RADIUS = 0.2;
const FIRE_RADIUS_GAIN = 0.08;
const LAMP_RADIUS = 0.16;
const LAMP_STRENGTH = 0.38;

export interface LightSource {
  x: number;
  y: number;
  life: number;
  max: number;
}

export interface LightCamera {
  scrollX: number;
  scrollY: number;
}

export function collectSceneLights(input: {
  fires: LightSource[];
  lamps: { x: number; y: number }[];
  camera: LightCamera;
  viewWidth: number;
  viewHeight: number;
  shakeX: number;
  shakeY: number;
}): SceneLight[] {
  const lights: SceneLight[] = [];
  for (const fire of input.fires) {
    const strength = fire.life / fire.max;
    lights.push(toScreenLight({
      x: fire.x, y: fire.y, radius: FIRE_RADIUS + strength * FIRE_RADIUS_GAIN, strength,
      red: 1, green: 0.42, blue: 0.08,
    }, input));
  }
  for (const lamp of input.lamps) {
    lights.push(toScreenLight({
      x: lamp.x, y: lamp.y, radius: LAMP_RADIUS, strength: LAMP_STRENGTH,
      red: 1, green: 0.86, blue: 0.55,
    }, input));
  }
  return lights;
}

function toScreenLight(
  light: SceneLight,
  input: { camera: LightCamera; viewWidth: number; viewHeight: number; shakeX: number; shakeY: number },
): SceneLight {
  return {
    x: (light.x - input.camera.scrollX + input.shakeX) / input.viewWidth,
    y: 1 - (light.y - input.camera.scrollY + input.shakeY) / input.viewHeight,
    radius: light.radius,
    strength: light.strength,
    red: light.red,
    green: light.green,
    blue: light.blue,
  };
}
