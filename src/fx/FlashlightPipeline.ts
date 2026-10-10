import Phaser from "phaser";

const MAX_LIGHTS = 8;

const FRAG = `
precision highp float;

uniform sampler2D uMainSampler;
uniform vec2  uPlayer;
uniform float uAngle;
uniform float uAspect;
uniform float uFlash;
uniform vec4  uLightPos[8];
uniform vec3  uLightColor[8];
varying vec2  outTexCoord;

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);

  vec2 d = outTexCoord - uPlayer;
  d.x *= uAspect;
  float dist = length(d);
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  float c = dot(d / max(dist, 0.0001), dir);

  float cone  = smoothstep(0.86, 0.98, c);
  float reach = 1.0 - smoothstep(0.0, 0.55, dist);
  float halo  = (1.0 - smoothstep(0.0, 0.07, dist)) * 0.5;
  float flash = (1.0 - smoothstep(0.0, 0.18, dist)) * uFlash;

  vec3 lamps = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    vec2 ld = outTexCoord - uLightPos[i].xy;
    ld.x *= uAspect;
    float glow = (1.0 - smoothstep(0.0, max(uLightPos[i].z, 0.001), length(ld))) * uLightPos[i].w;
    lamps += uLightColor[i] * glow;
  }

  float lampReveal = clamp(max(lamps.r, max(lamps.g, lamps.b)), 0.0, 1.0);
  float light = clamp(cone * reach + halo + flash + lampReveal, 0.0, 1.0);

  vec3 shadow = vec3(0.012, 0.016, 0.038);
  vec3 beam = vec3(0.76, 0.86, 1.0);
  vec3 rgb = color.rgb * mix(shadow, beam, light) + lamps * 0.5;
  gl_FragColor = vec4(rgb, color.a);
}
`;

export interface SceneLight {
  x: number;
  y: number;
  radius: number;
  strength: number;
  red: number;
  green: number;
  blue: number;
}

export class FlashlightPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  player = new Phaser.Math.Vector2(0.5, 0.5);
  angle = 0;
  aspect = 16 / 9;
  flash = 0;
  private readonly lightPos = new Float32Array(MAX_LIGHTS * 4);
  private readonly lightColor = new Float32Array(MAX_LIGHTS * 3);

  constructor(game: Phaser.Game) {
    super({ game, name: "Flashlight", fragShader: FRAG });
  }

  sync(x: number, y: number, angle: number) {
    this.player.set(x, y);
    this.angle = angle;
  }

  setLights(lights: SceneLight[]) {
    this.lightPos.fill(0);
    this.lightColor.fill(0);
    const count = Math.min(lights.length, MAX_LIGHTS);
    for (let index = 0; index < count; index++) {
      const light = lights[index];
      this.lightPos[index * 4] = light.x;
      this.lightPos[index * 4 + 1] = light.y;
      this.lightPos[index * 4 + 2] = light.radius;
      this.lightPos[index * 4 + 3] = light.strength;
      this.lightColor[index * 3] = light.red;
      this.lightColor[index * 3 + 1] = light.green;
      this.lightColor[index * 3 + 2] = light.blue;
    }
  }

  onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget) {
    this.upload();
    this.bindAndDraw(renderTarget);
  }

  private upload() {
    this.set2f("uPlayer", this.player.x, this.player.y);
    this.set1f("uAngle", this.angle);
    this.set1f("uAspect", this.aspect);
    this.set1f("uFlash", this.flash);
    this.set4fv("uLightPos", this.lightPos);
    this.set3fv("uLightColor", this.lightColor);
  }
}
