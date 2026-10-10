import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "../config";

export interface HudState {
  hp: number;
  maxHp: number;
  weapon: string;
  ammo: number;
  score: number;
  kills: number;
  seconds: number;
  dead: boolean;
  alarm: boolean;
}

/** HUD em uma cena separada, para não ser escurecido pelo shader da lanterna. */
export class UIScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private weaponText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;
  private alertText!: Phaser.GameObjects.Text;

  constructor() {
    super("UI");
  }

  create() {
    const style = { fontFamily: "monospace", fontSize: "18px", color: "#e8e8e8" };
    this.g = this.add.graphics();
    this.weaponText = this.add.text(24, VIEW_H - 56, "", style);
    this.scoreText = this.add.text(VIEW_W - 24, 20, "", style).setOrigin(1, 0).setAlign("right");
    this.add.text(VIEW_W / 2, VIEW_H - 22, "WASD mover · mouse mira/atira · 1/2/3 ou roda trocam de arma · gamepad suportado", {
      fontFamily: "monospace", fontSize: "13px", color: "#777777",
    }).setOrigin(0.5);
    this.overText = this.add.text(VIEW_W / 2, VIEW_H / 2, "", {
      fontFamily: "monospace", fontSize: "42px", color: "#ff4040", align: "center",
    }).setOrigin(0.5).setVisible(false);
    this.alertText = this.add.text(VIEW_W / 2, 48, "HORDA A CAMINHO", {
      fontFamily: "monospace", fontSize: "22px", color: "#ff4040", backgroundColor: "rgba(0,0,0,0.55)",
    }).setOrigin(0.5).setPadding(10, 4, 10, 4).setVisible(false);

    const game = this.scene.get("Game");
    game.events.on("hud", this.onHud, this);
    this.events.once("shutdown", () => game.events.off("hud", this.onHud, this));
  }

  private onHud(s: HudState) {
    const g = this.g;
    g.clear();
    g.fillStyle(0x000000, 0.6).fillRect(22, 22, 244, 20);
    const pct = Math.max(0, s.hp / s.maxHp);
    g.fillStyle(pct > 0.35 ? 0x3aa655 : 0xd03030, 1).fillRect(24, 24, 240 * pct, 16);

    const ammo = Number.isFinite(s.ammo) ? String(s.ammo) : "∞";
    this.weaponText.setText(`${s.weapon}  ${ammo}`);

    const m = Math.floor(s.seconds / 60);
    const sec = String(Math.floor(s.seconds % 60)).padStart(2, "0");
    this.scoreText.setText(`SCORE ${s.score}\nKILLS ${s.kills}\n${m}:${sec}`);

    this.overText.setVisible(s.dead);
    if (s.dead) this.overText.setText(`VOCÊ MORREU\nscore ${s.score} · kills ${s.kills}\n\npressione R para reiniciar`);
    const showAlarm = s.alarm && !s.dead;
    this.alertText.setVisible(showAlarm);
    if (showAlarm) this.alertText.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(s.seconds * 8)));
  }
}
