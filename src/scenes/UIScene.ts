import Phaser from "phaser";
import { LOW_HP_RATIO, VIEW_H, VIEW_W, WAVE_CALM_MS, type WeaponId } from "../config";
import * as sfx from "../audio/sfx";
import { isAmmoLow } from "../combat/ammo-warning";
import { calmFill } from "../waves/wave-director";
import { lowHealthBeatMs } from "../fx/low-health";
import { arrowTriangle, hudArrows, type ThreatPoint } from "../fx/offscreen-arrows";
import { WeaponWheelView } from "../combat/weapon-wheel-view";
import { volumeBar } from "../audio/volume";
import { pauseMenuLines } from "../input/pause-menu";
import { formatSurviveTime } from "../score/survive-time";

export interface HudState {
  hp: number;
  maxHp: number;
  weapon: string;
  ammo: number;
  ammoMax: number;
  grenades: number;
  score: number;
  bestScore: number;
  kills: number;
  dead: boolean;
  wave: number;
  phaseSeconds: number;
  calm: boolean;
  hordeLeft: number;
  nextHorde: string;
  banner: string;
  combo: number;
  comboLeft: number;
  paused: boolean;
  dashRecharge: number;
  threats: ThreatPoint[];
  scrollX: number;
  scrollY: number;
  wheelOpen: boolean;
  wheelHighlight: WeaponId | null;
  loadout: Record<WeaponId, number>;
  elapsed: number;
  pauseIndex: number;
  volume: number;
}

/** HUD em uma cena separada, para não ser escurecido pelo shader da lanterna. */
export class UIScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private weaponText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private overText!: Phaser.GameObjects.Text;
  private alertText!: Phaser.GameObjects.Text;
  private calmText!: Phaser.GameObjects.Text;
  private nextHordeText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private pauseText!: Phaser.GameObjects.Text;
  private pauseMenuText!: Phaser.GameObjects.Text;
  private shownCombo = 0;
  private hud: HudState | null = null;
  private beatLeft = 0;
  private beating = false;
  private pulse = 0;
  private wheelView!: WeaponWheelView;

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
    this.pauseText = this.add.text(VIEW_W / 2, VIEW_H / 2 - 90, "PAUSA", {
      fontFamily: "monospace", fontSize: "64px", color: "#f2efe4",
    }).setOrigin(0.5).setVisible(false);
    this.pauseMenuText = this.add.text(VIEW_W / 2, VIEW_H / 2 + 20, "", {
      fontFamily: "monospace", fontSize: "28px", color: "#f2efe4", align: "left",
    }).setOrigin(0.5, 0).setVisible(false);
    this.calmText = this.add.text(VIEW_W / 2, 128, "", {
      fontFamily: "monospace", fontSize: "54px", color: "#e2c14a",
    }).setOrigin(0.5).setVisible(false);
    this.nextHordeText = this.add.text(VIEW_W / 2, 172, "", {
      fontFamily: "monospace", fontSize: "18px", color: "#f2efe4",
    }).setOrigin(0.5).setVisible(false);
    this.alertText = this.add.text(VIEW_W / 2, 48, "HORDA A CAMINHO", {
      fontFamily: "monospace", fontSize: "22px", color: "#ff4040", backgroundColor: "rgba(0,0,0,0.55)",
    }).setOrigin(0.5).setPadding(10, 4, 10, 4).setVisible(false);

    this.wheelView = new WeaponWheelView(this);
    const game = this.scene.get("Game");
    game.events.on("hud", this.onHud, this);
    this.events.once("shutdown", () => game.events.off("hud", this.onHud, this));
  }

  update(_time: number, delta: number) {
    const hud = this.hud;
    if (!hud) return;
    const interval = lowHealthBeatMs(hud.hp, hud.maxHp);
    if (!interval || hud.dead) {
      this.beating = false;
      this.pulse = 0;
      return;
    }
    if (!this.beating) {
      this.beating = true;
      this.beatLeft = 0;
    }
    if (hud.paused) return;
    this.pulse += delta;
    this.beatLeft -= delta;
    if (this.beatLeft > 0) return;
    sfx.heartbeat();
    this.beatLeft = interval;
  }

  private drawDashMark(s: HudState) {
    if (s.dead || s.dashRecharge >= 1) return;
    this.g.fillStyle(0x000000, 0.6).fillRect(22, 46, 64, 8);
    this.g.fillStyle(0x7fd4ff, 1).fillRect(24, 48, 60 * s.dashRecharge, 4);
  }

  private drawCalm(s: HudState) {
    const show = s.calm && !s.dead && !s.wheelOpen;
    this.calmText.setVisible(show);
    this.nextHordeText.setVisible(show);
    if (!show) return;
    const width = 320;
    const x = (VIEW_W - width) / 2;
    const y = 82;
    const fill = (width - 4) * calmFill(s.phaseSeconds, WAVE_CALM_MS);
    this.g.fillStyle(0x000000, 0.6).fillRect(x, y, width, 12);
    this.g.fillStyle(0xe2c14a, 1).fillRect(x + 2, y + 2, fill, 8);
    this.calmText.setText(String(Math.ceil(s.phaseSeconds)));
    this.nextHordeText.setText(`a seguir: ${s.nextHorde}`);
  }

  private drawThreatArrows(s: HudState) {
    const arrows = hudArrows(s.threats, s.scrollX, s.scrollY);
    for (const arrow of arrows) {
      const shadow = arrowTriangle(arrow, 16, 9);
      const mark = arrowTriangle(arrow, 12, 6);
      this.g.fillStyle(0x140c08, 0.9).fillTriangle(shadow[0], shadow[1], shadow[2], shadow[3], shadow[4], shadow[5]);
      this.g.fillStyle(arrow.color, 1).fillTriangle(mark[0], mark[1], mark[2], mark[3], mark[4], mark[5]);
    }
  }

  private onHud(s: HudState) {
    this.hud = s;
    const g = this.g;
    g.clear();
    g.fillStyle(0x000000, 0.6).fillRect(22, 22, 244, 20);
    const pct = Math.max(0, s.hp / s.maxHp);
    const critical = s.hp > 0 && pct < LOW_HP_RATIO;
    const alpha = critical ? 0.55 + 0.45 * Math.abs(Math.sin(this.pulse / 160)) : 1;
    g.fillStyle(critical ? 0xd03030 : 0x3aa655, alpha).fillRect(24, 24, 240 * pct, 16);
    this.drawDashMark(s);
    this.drawCalm(s);
    this.drawThreatArrows(s);
    this.wheelView.paint(g, s);

    const ammo = Number.isFinite(s.ammo) ? String(s.ammo) : "∞";
    this.weaponText.setText(`${s.weapon}  ${ammo}   GRANADAS ${s.grenades}`);
    this.weaponText.setColor(isAmmoLow(s.ammo, s.ammoMax) ? "#ffb02e" : "#e8e8e8");

    const sec = String(Math.ceil(s.phaseSeconds)).padStart(2, "0");
    const clock = s.calm ? `0:${sec}` : `FALTAM ${s.hordeLeft}`;
    this.scoreText.setText(
      `ONDA ${s.wave}\nSCORE ${s.score}\nRECORDE ${s.bestScore}\nKILLS ${s.kills}\n${formatSurviveTime(s.elapsed)}\n${clock}`,
    );

    this.overText.setVisible(s.dead);
    const showPause = s.paused && !s.dead;
    this.pauseText.setVisible(showPause);
    this.pauseMenuText.setVisible(showPause);
    if (showPause) this.pauseMenuText.setText(pauseMenuLines(s.pauseIndex, s.volume, volumeBar));
    if (s.dead) this.overText.setText(`VOCÊ MORREU\nonda ${s.wave}\nscore ${s.score} · kills ${s.kills}\nrecorde ${s.bestScore}\ntempo ${formatSurviveTime(s.elapsed)}\n\npressione R para reiniciar`);
    const showCombo = s.combo >= 2 && !s.dead && !s.wheelOpen;
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
    this.alertText.setColor(s.banner === "PRÓXIMA HORDA" || s.banner.includes(" — ") ? "#e2c14a" : "#ff4040");
    this.alertText.setAlpha(0.55 + 0.45 * Math.abs(Math.sin(s.phaseSeconds * 8)));
  }
}
