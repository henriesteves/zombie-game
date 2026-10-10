export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_W = 2400;
export const WORLD_H = 1600;
export const STREET_LEFT = 700;
export const STREET_RIGHT = 1700;
export const CAR_FIRE_MS = 5200;
export const CAR_FIRE_RADIUS = 56;
export const CAR_FIRE_TICK_MS = 450;
export const CAR_FIRE_ZOMBIE_DAMAGE = 1;
export const CAR_FIRE_PLAYER_DAMAGE = 8;
export const HIT_STOP_MS = 46;
export const BLAST_STOP_MS = 80;
export const DECAL_DRY_MS = 9000;
export const COMBO_WINDOW_MS = 1600;
export const COMBO_CAP = 8;
export const SCORE_POPUP_MS = 700;
export const SCORE_POPUP_RISE = 0.05;
export const LASER_RANGE = 640;
export const LASER_STEP = 8;
export const LASER_WIDTH = 2;
export const LASER_DOT_RADIUS = 4;
export const LASER_MUZZLE = 26;
export const LASER_BARREL_RADIUS = 14;
export const BUILDING_BLOCK_H = 260;
export const BUILDING_GAP = 150;

export const PLAYER_SPEED = 210;
export const DASH_SPEED = 720;
export const DASH_MS = 150;
export const DASH_COOLDOWN_MS = 800;
export const DASH_TRAIL_MS = 180;
export const KNOCK_SPEED = 340;
export const KNOCK_MS = 140;
export const PLAYER_MAX_HP = 100;
export const LOW_HP_RATIO = 0.35;
export const LOW_HP_BEAT_MS = 920;
export const LOW_HP_BEAT_MIN_MS = 320;
export const OFFSCREEN_ARROW_CAP = 8;
export const OFFSCREEN_ARROW_INSET = 36;

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
export const AMMO_LOW_RATIO = 0.2;

// ---------- Zumbis ----------
export type ZombieKind = "walker" | "runner" | "brute" | "bloater" | "spitter";

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
  bloater: { texture: "zombie_bloater", hp: 8, speed: 36, damage: 14, score: 40, radius: 18, knockback: 60, charge: null },
  spitter: { texture: "zombie_spitter", hp: 4, speed: 70, damage: 8, score: 25, radius: 14, knockback: 90, charge: null },
};

export const OFFSCREEN_ARROW_COLORS: Record<ZombieKind, number> = {
  walker: 0xffe14a,
  runner: 0xff8a2a,
  brute: 0xff3030,
  bloater: 0x9be35a,
  spitter: 0xff5ad2,
};

export const BLOATER_CHANCE = 0.08;
export const SPITTER_CHANCE = 0.06;
export const SPITTER_RANGE = 220;
export const SPITTER_COOLDOWN_MS = 1400;
export const SPITTER_WINDUP_MS = 520;
export const SPIT_SPEED = 180;
export const SPIT_LIFE_MS = 1600;
export const SPIT_DAMAGE = 12;
export const SPIT_SPAWN_OFFSET = 20;
export const BLOATER_BLAST_RADIUS = 120;
export const BLOATER_ZOMBIE_DAMAGE = 18;
export const BLOATER_PLAYER_DAMAGE = 30;

export const FLOW_CELL = 32;
export const FLOW_REBUILD_MS = 180;
export const FLOW_CLEARANCE = 12;
export const HORDE_PLAYER_PUSH_RADIUS = 44;
export const HORDE_PLAYER_PUSH_MAX = 2;

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
export const CAR_SMOKE_HITS = 6;
export const ALARM_WAVE_CARS = 2;
export const GAMEPAD_START_BUTTON = 9;
export const HEALTH_PICKUP = 25;
export const PICKUP_LIFE_MS = 20000;
export const PICKUP_MAGNET_RADIUS = 96;
export const PICKUP_MAGNET_SPEED = 260;
export const DROP_HEALTH = 0.1;
export const DROP_SMG = 0.09;
export const DROP_SHOTGUN = 0.07;
