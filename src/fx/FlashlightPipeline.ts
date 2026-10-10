import Phaser from "phaser";

// Escurece a cena e deixa visível apenas o cone da lanterna + um halo ao redor do jogador.
// Coordenadas em UV (origem embaixo à esquerda): por isso o ângulo vem com o sinal invertido.
const FRAG = `
precision highp float;

uniform sampler2D uMainSampler;
uniform vec2  uPlayer;   // posição do jogador em UV
uniform float uAngle;    // direção da mira em UV (radianos)
uniform float uAspect;   // largura / altura
uniform float uFlash;    // 0..1, clarão do tiro
varying vec2  outTexCoord;

void main() {
  vec4 color = texture2D(uMainSampler, outTexCoord);

  vec2 d = outTexCoord - uPlayer;
  d.x *= uAspect;
  float dist = length(d);
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  float c = dot(d / max(dist, 0.0001), dir);

  float cone    = smoothstep(0.80, 0.95, c);
  float reach   = 1.0 - smoothstep(0.05, 0.78, dist);
  float halo    = (1.0 - smoothstep(0.0, 0.13, dist)) * 0.65;
  float flash   = (1.0 - smoothstep(0.0, 0.36, dist)) * uFlash * 0.55;

  float light = clamp(cone * reach + halo + flash, 0.0, 1.0);

  vec3 shadow = vec3(0.045, 0.055, 0.085);
  vec3 lit    = vec3(1.0, 0.97, 0.88);
  gl_FragColor = vec4(color.rgb * mix(shadow, lit, light), color.a);
}
`;

export class FlashlightPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  player = new Phaser.Math.Vector2(0.5, 0.5);
  angle = 0;
  aspect = 16 / 9;
  flash = 0;

  constructor(game: Phaser.Game) {
    super({ game, name: "Flashlight", fragShader: FRAG });
  }

  sync(x: number, y: number, angle: number) {
    this.player.set(x, y);
    this.angle = angle;
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
  }
}
