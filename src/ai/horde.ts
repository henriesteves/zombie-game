import Phaser from "phaser";
import { FLOW_REBUILD_MS, ZOMBIES } from "../config";
import * as sfx from "../audio/sfx";
import type { Zombie } from "../entities/Zombie";
import { remainMs } from "../time/remain-ms";
import type { FlowField } from "./flow-field";
import { syncWalk } from "../fx/walk-cycle";
import { playerPush } from "./player-push";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;

const SEPARATION_RANGE = 40;
const SEPARATION_DISTANCE_SQ = SEPARATION_RANGE * SEPARATION_RANGE;
const BARREL_BLOCK_RADIUS = 12;
const SHADOW_BRUTE = 40;
const SHADOW_BLOATER = 32;
const SHADOW_WALKER = 24;
const GROAN_RANGE = 700;
const GROAN_CHANCE = 0.00004;
const HORDE_LEVEL_DIVISOR = 36;

export interface HordeView {
  time: number;
  deltaMs: number;
  flowReadyAt: number;
  live: Zombie[];
  flow: FlowField;
  buildings: Sprite[];
  cars: Sprite[];
  barrels: Sprite[];
  zombies: Zombie[];
  player: { x: number; y: number };
  shadows: Phaser.GameObjects.Graphics;
}

export function updateHorde(view: HordeView): number {
  const live = collectLive(view.zombies, view.live);
  separateZombies(live);
  const flowReadyAt = rebuildFlow(view);
  for (const zombie of live) {
    steerZombie(zombie, view);
    syncWalk(zombie, ZOMBIES[zombie.kind].texture, view.deltaMs);
  }
  drawShadows(view.shadows, view.player, live);
  sfx.setHordeLevel(live.length / HORDE_LEVEL_DIVISOR);
  return flowReadyAt;
}

function collectLive(zombies: Zombie[], live: Zombie[]): Zombie[] {
  live.length = 0;
  for (const zombie of zombies) {
    if (!zombie.active) continue;
    zombie.sepX = 0;
    zombie.sepY = 0;
    live.push(zombie);
  }
  return live;
}

function separateZombies(live: Zombie[]) {
  for (let i = 0; i < live.length; i += 1) {
    const left = live[i];
    for (let j = i + 1; j < live.length; j += 1) {
      pushApart(left, live[j]);
    }
  }
}

function pushApart(left: Zombie, right: Zombie) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  const distanceSq = dx * dx + dy * dy;
  if (distanceSq > SEPARATION_DISTANCE_SQ || distanceSq === 0) return;
  const distance = Math.sqrt(distanceSq);
  const push = (SEPARATION_RANGE - distance) / SEPARATION_RANGE;
  const nx = (dx / distance) * push;
  const ny = (dy / distance) * push;
  left.sepX += nx;
  left.sepY += ny;
  right.sepX -= nx;
  right.sepY -= ny;
}

function rebuildFlow(view: HordeView): number {
  if (view.time < view.flowReadyAt) return view.flowReadyAt;
  view.flow.clear();
  for (const building of view.buildings) {
    view.flow.blockRect(building.x, building.y, building.displayWidth * 0.5, building.displayHeight * 0.5);
  }
  for (const car of view.cars) {
    if (!car.active) continue;
    view.flow.blockRect(car.x, car.y, car.width * 0.5, car.height * 0.5);
  }
  for (const barrel of view.barrels) {
    if (!barrel.active) continue;
    view.flow.blockCircle(barrel.x, barrel.y, BARREL_BLOCK_RADIUS);
  }
  view.flow.rebuild([{ x: view.player.x, y: view.player.y }]);
  return view.time + FLOW_REBUILD_MS;
}

function steerZombie(zombie: Zombie, view: HordeView) {
  const body = zombie.body as Body;
  if (zombie.hitLeft > 0) {
    zombie.hitLeft = remainMs(zombie.hitLeft, view.deltaMs);
    if (zombie.hitLeft > 0) {
      zombie.interruptCharge();
      zombie.tickChargeCooldown(view.deltaMs);
      body.velocity.scale(0.9);
      return;
    }
  }
  if (zombie.isTinted) zombie.clearTint();
  const step = zombie.advanceCharge(view.deltaMs, view.player.x, view.player.y);
  if (step === "start") sfx.bruteWindup();
  if (step) return;
  const aim = aimDirection(zombie, view);
  const wobble = Math.sin(view.time / 300 + zombie.wobble) * 0.25;
  const vx = aim.x - aim.y * wobble + zombie.sepX * 1.2;
  const vy = aim.y + aim.x * wobble + zombie.sepY * 1.2;
  const length = Math.hypot(vx, vy) || 1;
  const push = playerPush(zombie.x, zombie.y, view.player.x, view.player.y);
  zombie.setRotation(Math.atan2(aim.y, aim.x));
  zombie.setVelocity((vx / length + push.x) * zombie.speed, (vy / length + push.y) * zombie.speed);
  const dist = Math.hypot(view.player.x - zombie.x, view.player.y - zombie.y);
  if (dist < GROAN_RANGE && Math.random() < GROAN_CHANCE) sfx.groan(zombie.kind === "brute" ? 0.6 : 1);
}

function aimDirection(zombie: Zombie, view: HordeView): { x: number; y: number } {
  const flow = view.flow.sample(zombie.x, zombie.y);
  if (flow) return flow;
  const dx = view.player.x - zombie.x;
  const dy = view.player.y - zombie.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function drawShadows(graphics: Phaser.GameObjects.Graphics, player: { x: number; y: number }, live: Zombie[]) {
  graphics.clear();
  graphics.fillStyle(0x000000, 0.45);
  graphics.fillEllipse(player.x, player.y + 8, 22, 10);
  for (const zombie of live) {
    graphics.fillEllipse(zombie.x, zombie.y + 8, shadowWidth(zombie), 11);
  }
}

function shadowWidth(zombie: Zombie): number {
  if (zombie.kind === "brute") return SHADOW_BRUTE;
  if (zombie.kind === "bloater") return SHADOW_BLOATER;
  return SHADOW_WALKER;
}
