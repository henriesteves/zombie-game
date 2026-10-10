import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "../config";
import { generateAllTextures } from "../assets/proceduralTextures";
import * as sfx from "../audio/sfx";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    generateAllTextures(this);

    this.add.text(VIEW_W / 2, VIEW_H / 2 - 30, "ZOMBIE GAME", {
      fontFamily: "monospace", fontSize: "64px", color: "#d03030",
    }).setOrigin(0.5);
    const start = this.add.text(VIEW_W / 2, VIEW_H / 2 + 40, "clique para jogar", {
      fontFamily: "monospace", fontSize: "24px", color: "#cccccc",
    }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    // Navegadores só liberam áudio após um gesto do usuário
    this.input.once("pointerdown", () => {
      sfx.unlockAudio();
      this.scene.start("Game");
      this.scene.launch("UI");
    });
  }
}
