import Phaser from "phaser";
import * as sfx from "../audio/sfx";
import {
  GRENADE_COOLDOWN_MS, GRENADE_FUSE_MS, GRENADE_MAX, GRENADE_SPAWN_OFFSET, GRENADE_SPEED, GRENADE_START,
} from "../config";
import { remainMs } from "../time/remain-ms";

const GRENADE_DEPTH = 11;
const GRENADE_SWELL = 0.35;

export interface GrenadeBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuseMs: number;
}

export interface GrenadeThrow {
  count: number;
  aim: number;
  x: number;
  y: number;
  cooldownMs: number;
}

export interface GrenadeThrowResult {
  count: number;
  cooldownMs: number;
  body: GrenadeBody | null;
  empty: boolean;
}

export interface GrenadeStep {
  body: GrenadeBody;
  detonated: boolean;
}

export function throwGrenade(input: GrenadeThrow): GrenadeThrowResult {
  if (input.cooldownMs > 0) return { count: input.count, cooldownMs: input.cooldownMs, body: null, empty: false };
  if (input.count <= 0) return { count: input.count, cooldownMs: input.cooldownMs, body: null, empty: true };
  return { count: input.count - 1, cooldownMs: GRENADE_COOLDOWN_MS, body: launchGrenade(input), empty: false };
}

export function stepGrenade(body: GrenadeBody, deltaMs: number): GrenadeStep {
  if (deltaMs <= 0) return { body, detonated: false };
  const travelMs = Math.min(deltaMs, body.fuseMs);
  const seconds = travelMs / 1000;
  const next = {
    x: body.x + body.vx * seconds,
    y: body.y + body.vy * seconds,
    vx: body.vx,
    vy: body.vy,
    fuseMs: body.fuseMs - travelMs,
  };
  return { body: next, detonated: next.fuseMs <= 0 };
}

function launchGrenade(input: GrenadeThrow): GrenadeBody {
  return {
    x: input.x + Math.cos(input.aim) * GRENADE_SPAWN_OFFSET,
    y: input.y + Math.sin(input.aim) * GRENADE_SPAWN_OFFSET,
    vx: Math.cos(input.aim) * GRENADE_SPEED,
    vy: Math.sin(input.aim) * GRENADE_SPEED,
    fuseMs: GRENADE_FUSE_MS,
  };
}

interface LiveGrenade {
  sprite: Phaser.GameObjects.Image;
  body: GrenadeBody;
}

export class Grenades {
  private stock = GRENADE_START;
  private cooldownMs = 0;
  private held = false;
  private readonly live: LiveGrenade[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: () => { x: number; y: number },
    private readonly detonate: (x: number, y: number) => void,
  ) {}

  get count(): number {
    return this.stock;
  }

  add(amount: number): void {
    this.stock = Math.min(GRENADE_MAX, this.stock + amount);
  }

  clear(): void {
    for (const grenade of this.live) grenade.sprite.destroy();
    this.live.length = 0;
  }

  press(aim: number, held: boolean): void {
    const rising = held && !this.held;
    this.held = held;
    if (!rising) return;
    const origin = this.player();
    const thrown = throwGrenade({ count: this.stock, aim, x: origin.x, y: origin.y, cooldownMs: this.cooldownMs });
    this.stock = thrown.count;
    this.cooldownMs = thrown.cooldownMs;
    if (thrown.empty) sfx.click();
    if (!thrown.body) return;
    this.spawn(thrown.body);
  }

  advance(deltaMs: number): void {
    this.cooldownMs = remainMs(this.cooldownMs, deltaMs);
    for (const grenade of this.live.slice()) this.fly(grenade, deltaMs);
  }

  private fly(grenade: LiveGrenade, deltaMs: number): void {
    if (!this.live.includes(grenade)) return;
    const step = stepGrenade(grenade.body, deltaMs);
    grenade.body = step.body;
    grenade.sprite.setPosition(step.body.x, step.body.y);
    grenade.sprite.setScale(1 + (1 - step.body.fuseMs / GRENADE_FUSE_MS) * GRENADE_SWELL);
    if (!step.detonated) return;
    this.remove(grenade);
    this.detonate(step.body.x, step.body.y);
  }

  private spawn(body: GrenadeBody): void {
    const sprite = this.scene.add.image(body.x, body.y, "grenade").setDepth(GRENADE_DEPTH);
    this.live.push({ sprite, body });
  }

  private remove(grenade: LiveGrenade): void {
    const index = this.live.indexOf(grenade);
    if (index < 0) return;
    this.live.splice(index, 1);
    grenade.sprite.destroy();
  }
}
