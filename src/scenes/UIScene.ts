import Phaser from "phaser";
import { VIEW_H, VIEW_W } from "../config";

export interface HudState {
  hp: number;
  maxHp: number;
  weapon: string;
  ammo: number;
  score: number;
  kills: number;
  dead: boolean;
  wave: number;
  phaseSeconds: number;
  banner: string;
  combo: number;
  comboLeft: number;
}

/** HUD em uma cena separada, para não ser escurecido pelo shader da lanterna. */
export class UIScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private weaponText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;
  private alertText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private shownCombo = 0;

  constructor() {
    super("UI");
  }

  create() {
    const style = { fontFamily: "monospace", fontSize: "18px", color: "#e8e8e8" };
    this.g = this.add.graphics();
    this.weaponText = this.add.text(24, VIEW_H - 56, "", style);
    this.scoreText = this.add.text(VIEW_W - 24, 20, "", style).setOrigin(1, 0).setAlign("right");
    this.overText = this.add.text(VIEW_W / 2, VIEW_H / 2, "", {
      fontFamily: "monospace", fontSize: "42px", color: "#ff4040", align: "center",
    }).setOrigin(0.5).setVisible(false);
    this.comboText = this.add.text(VIEW_W / 2, VIEW_H * 0.62, "", {
      fontFamily: "monospace", fontSize: "54px", color: "#f2efe4",
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

    const sec = String(Math.ceil(s.phaseSeconds)).padStart(2, "0");
    this.scoreText.setText(`ONDA ${s.wave}\nSCORE ${s.score}\nKILLS ${s.kills}\n0:${sec}`);

    this.overText.setVisible(s.dead);
    if (s.dead) this.overText.setText(`VOCÊ MORREU\nscore ${s.score} · kills ${s.kills}\n\npressione R para reiniciar`);
    const showCombo = s.combo >= 2 && !s.dead;
    this.comboText.setVisible(showCombo);
    if (!showCombo) this.shownCombo = 0;
    if (showCombo) {
      this.comboText.setText(`x${s.combo}`);
      this.comboText.setAlpha(0.4 + 0.6 * s.comboLeft);
      if (s.combo !== this.shownCombo) this.comboText.setScale(1.4);
      this.shownCombo = s.combo;
      const nextScale = this.comboText.scaleX + (1 - this.comboText.scaleX) * 0.25;
      this.comboText.setScale(nextScale);
    }
    const showBanner = s.banner !== "" && !s.dead;
    this.alertText.setVisible(showBanner);
    if (!showBanner) return;
    this.alertText.setText(s.banner);
    this.alertText.setColor(s.banner === "RESPIRO" ? "#e2c14a" : "#ff4040");
    this.alertText.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(s.phaseSeconds * 8)));
  }
}
