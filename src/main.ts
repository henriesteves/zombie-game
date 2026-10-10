import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "./config";
import { FlashlightPipeline } from "./fx/FlashlightPipeline";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

new Phaser.Game({
  type: Phaser.WEBGL, // a lanterna usa PostFX, que exige WebGL
  parent: "game",
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: "#000000",
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  input: { gamepad: true },
  // O Phaser instancia com `new Pipeline(game)`; os typings antigos esperam outra assinatura, daí o cast.
  pipeline: { Flashlight: FlashlightPipeline as unknown as typeof Phaser.Renderer.WebGL.WebGLPipeline },
  scene: [BootScene, GameScene, UIScene], // UI por último = desenhada por cima
});
