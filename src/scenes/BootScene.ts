import Phaser from "phaser";
import { GAMEPAD_START_BUTTON, VIEW_H, VIEW_W } from "../config";
import { generateAllTextures } from "../assets/proceduralTextures";
import * as sfx from "../audio/sfx";
import { wantsBootStart } from "../input/boot-start";

export class BootScene extends Phaser.Scene {
  private started = false;
  private keyDown = false;

  constructor() {
    super("Boot");
  }

  create() {
    generateAllTextures(this);
    this.add.text(VIEW_W / 2, VIEW_H / 2 - 30, "ZOMBIE GAME", {
      fontFamily: "monospace", fontSize: "64px", color: "#d03030",
    }).setOrigin(0.5);
    const prompt = this.add.text(VIEW_W / 2, VIEW_H / 2 + 40, "clique, tecla ou A para jogar", {
      fontFamily: "monospace", fontSize: "24px", color: "#cccccc",
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    this.input.on("pointerdown", () => this.tryStart(true, this.keyDown, this.padConfirm()));
    const onKey = () => {
      this.keyDown = true;
      this.tryStart(false, true, this.padConfirm());
    };
    window.addEventListener("keydown", onKey);
    this.input.keyboard?.on("keydown", onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener("keydown", onKey));
  }

  update() {
    this.tryStart(false, this.keyDown, this.padConfirm());
  }

  private padConfirm(): boolean {
    const pad = this.input.gamepad?.getPad(0);
    if (!pad?.connected) return false;
    if (pad.A) return true;
    return pad.buttons.length > GAMEPAD_START_BUTTON && pad.isButtonDown(GAMEPAD_START_BUTTON);
  }

  private tryStart(pointer: boolean, key: boolean, pad: boolean) {
    if (this.started || !wantsBootStart(pointer, key, pad)) return;
    this.started = true;
    sfx.unlockAudio();
    this.scene.start("Game");
    this.scene.launch("UI");
  }
}
