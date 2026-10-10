import Phaser from "phaser";
import { VIEW_H, VIEW_W, WEAPONS, WEAPON_ORDER, type WeaponId } from "../config";
import type { HudState } from "../scenes/UIScene";

const TAU = Math.PI * 2;
const TOP = -Math.PI / 2;
const RING_RADIUS = 148;
const LABEL_RADIUS = 196;
const RING_GAP = 0.09;
const IDLE_THICKNESS = 18;
const HOT_THICKNESS = 28;

const WHEEL_TINT: Record<WeaponId, number> = {
  pistol: 0xd8d2c4,
  smg: 0xe2a04a,
  shotgun: 0xc4483a,
  rifle: 0x8eb8c9,
  magnum: 0xd6b15a,
};

export class WeaponWheelView {
  private readonly labels: Phaser.GameObjects.Text[];

  constructor(scene: Phaser.Scene) {
    this.labels = WEAPON_ORDER.map((id) => scene.add.text(0, 0, WEAPONS[id].name, {
      fontFamily: "monospace", fontSize: "15px", color: "#f2efe4", align: "center",
    }).setOrigin(0.5).setDepth(40).setVisible(false).setStroke("#140e0c", 4));
  }

  paint(graphics: Phaser.GameObjects.Graphics, hud: HudState): void {
    if (!hud.wheelOpen || !hud.wheelHighlight) {
      this.hideLabels();
      return;
    }
    const centerX = VIEW_W / 2;
    const centerY = VIEW_H / 2;
    const sector = TAU / WEAPON_ORDER.length;
    graphics.lineStyle(22, 0x140e0c, 0.78);
    graphics.beginPath();
    graphics.arc(centerX, centerY, RING_RADIUS, 0, TAU, false);
    graphics.strokePath();
    WEAPON_ORDER.forEach((id, index) => {
      this.paintWedge(graphics, hud, id, index, sector, centerX, centerY);
    });
  }

  private paintWedge(
    graphics: Phaser.GameObjects.Graphics,
    hud: HudState,
    id: WeaponId,
    index: number,
    sector: number,
    centerX: number,
    centerY: number,
  ): void {
    const start = TOP + sector * index;
    const gap = sector * RING_GAP;
    const selected = id === hud.wheelHighlight;
    const empty = hud.loadout[id] <= 0;
    const tint = WHEEL_TINT[id];
    graphics.lineStyle(selected ? HOT_THICKNESS : IDLE_THICKNESS, tint, empty ? 0.22 : selected ? 1 : 0.5);
    graphics.beginPath();
    graphics.arc(centerX, centerY, RING_RADIUS, start + gap, start + sector - gap, false, 0.02);
    graphics.strokePath();
    const mid = start + sector / 2;
    const label = this.labels[index];
    label.setVisible(true);
    label.setPosition(centerX + Math.cos(mid) * LABEL_RADIUS, centerY + Math.sin(mid) * LABEL_RADIUS);
    label.setText(`${WEAPONS[id].name}\n${ammoText(hud.loadout[id])}`);
    label.setColor(selected && !empty ? hex(tint) : "#f2efe4");
    label.setAlpha(empty ? 0.4 : 1);
  }

  private hideLabels(): void {
    for (const label of this.labels) label.setVisible(false);
  }
}

function ammoText(amount: number): string {
  return Number.isFinite(amount) ? String(amount) : "∞";
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
