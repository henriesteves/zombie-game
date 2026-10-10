export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_W = 2400;
export const WORLD_H = 1600;
export const STREET_LEFT = 700;
export const STREET_RIGHT = 1700;
export const CAR_FIRE_MS = 5200;
export const BUILDING_BLOCK_H = 260;
export const BUILDING_GAP = 150;

export const PLAYER_SPEED = 210;
export const PLAYER_MAX_HP = 100;

// ---------- Armas (dados, não código) ----------
export type WeaponId = "pistol" | "smg" | "shotgun";

export interface WeaponDef {
  name: string;
  cooldown: number; // ms entre tiros
  pellets: number; // projéteis por tiro
  spread: number; // dispersão em radianos (±)
  speed: number; // px/s
  damage: number;
  life: number; // ms até o projétil sumir
  ammoMax: number;
  ammoStart: number;
  ammoPerPickup: number;
  shake: number; // intensidade do screen shake por tiro
}

export const WEAPON_ORDER: WeaponId[] = ["pistol", "smg", "shotgun"];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: { name: "PISTOLA", cooldown: 320, pellets: 1, spread: 0.03, speed: 760, damage: 1, life: 700, ammoMax: Infinity, ammoStart: Infinity, ammoPerPickup: 0, shake: 0.0015 },
  smg: { name: "SMG", cooldown: 85, pellets: 1, spread: 0.09, speed: 860, damage: 1, life: 650, ammoMax: 240, ammoStart: 90, ammoPerPickup: 40, shake: 0.002 },
  shotgun: { name: "SHOTGUN", cooldown: 750, pellets: 7, spread: 0.32, speed: 780, damage: 1.4, life: 380, ammoMax: 48, ammoStart: 24, ammoPerPickup: 8, shake: 0.006 },
};

export function startingAmmo(): Record<WeaponId, number> {
  return {
    pistol: WEAPONS.pistol.ammoStart,
    smg: WEAPONS.smg.ammoStart,
    shotgun: WEAPONS.shotgun.ammoStart,
  };
}

export type PickupKind = "health" | "smg" | "shotgun";

// ---------- Zumbis ----------
export type ZombieKind = "walker" | "runner" | "brute";

export interface ZombieCharge {
  range: number;
  windupMs: number;
  dashMs: number;
  speed: number;
  cooldownMs: number;
}

export interface ZombieDef {
  texture: string;
  hp: number;
  speed: number;
  damage: number;
  score: number;
  radius: number;
  knockback: number;
  charge: ZombieCharge | null;
}

export const ZOMBIES: Record<ZombieKind, ZombieDef> = {
  walker: { texture: "zombie_walker", hp: 3, speed: 62, damage: 8, score: 10, radius: 15, knockback: 110, charge: null },
  runner: { texture: "zombie_runner", hp: 2, speed: 135, damage: 6, score: 15, radius: 13, knockback: 140, charge: null },
  brute: {
    texture: "zombie_brute", hp: 16, speed: 46, damage: 25, score: 60, radius: 22, knockback: 25,
    charge: { range: 210, windupMs: 480, dashMs: 320, speed: 340, cooldownMs: 2600 },
  },
};

export const FLOW_CELL = 32;
export const FLOW_REBUILD_MS = 180;
export const FLOW_CLEARANCE = 12;

export const EXPLOSION_RADIUS = 130;
export const BARREL_ZOMBIE_DAMAGE = 20;
export const BARREL_PLAYER_DAMAGE = 35;
export const CAR_BLAST_RADIUS = 190;
export const CAR_ZOMBIE_DAMAGE = 28;
export const CAR_PLAYER_DAMAGE = 48;
export const CAR_BLAST_HITS = 6;
export const ALARM_DURATION = 6000;
export const ALARM_SPAWN_COUNT = 8;
export const ALARM_SPAWN_SPREAD = 160;
export const WORLD_INSET = 40;
export const SPAWN_VIEW_MARGIN = 70;
export const SPAWN_DEPTH_MIN = 48;
export const SPAWN_DEPTH_MAX = 180;

export const WAVE_FIGHT_MS = 35000;
export const WAVE_CALM_MS = 8000;
export const WAVE_BANNER_MS = 4000;
export const SPAWN_INTERVAL_START = 900;
export const SPAWN_INTERVAL_STEP = 70;
export const SPAWN_INTERVAL_MIN = 180;
export const SPAWN_CAP = 150;
export const SPAWN_BASE = 16;
export const SPAWN_PER_WAVE = 5;
export const CAR_HITS = 10;
export const ALARM_WAVE_CARS = 2;
export const HEALTH_PICKUP = 25;
export const PICKUP_LIFE_MS = 20000;
export const DROP_HEALTH = 0.1;
export const DROP_SMG = 0.09;
export const DROP_SHOTGUN = 0.07;
