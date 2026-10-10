import {
  BLOATER_CHANCE, SPAWN_BASE, SPAWN_CAP, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START, SPAWN_INTERVAL_STEP, SPAWN_PER_WAVE,
  ALARM_EXTRA_CAP, SPITTER_CHANCE, WAVE_BANNER_MS, WAVE_CALM_MS, type ZombieKind,
} from "../config";

export type WavePhase = "fight" | "calm";
export type WaveModifier = "clear" | "runners" | "brute" | "alarms";
export type WaveEvent = "calm-started" | "fight-started";

const MODIFIER_ORDER: WaveModifier[] = ["runners", "brute", "alarms"];

export function modifierFor(wave: number): WaveModifier {
  if (wave <= 1) return "clear";
  return MODIFIER_ORDER[(wave - 2) % MODIFIER_ORDER.length];
}

export function modifierLabel(modifier: WaveModifier): string {
  if (modifier === "runners") return "CORREDORES";
  if (modifier === "brute") return "BRUTE";
  if (modifier === "alarms") return "ALARMES";
  return "HORDA";
}

export function nextHordeLabel(wave: number): string {
  return modifierLabel(modifierFor(wave + 1));
}

export interface SpawnBands {
  brute: number;
  runner: number;
  bloater: number;
  spitter: number;
}

export function getSpawnBands(wave: number, modifier: WaveModifier): SpawnBands {
  return {
    brute: bruteChance(wave, modifier),
    runner: runnerChance(wave, modifier),
    bloater: wave >= 3 ? BLOATER_CHANCE : 0,
    spitter: wave >= 4 ? SPITTER_CHANCE : 0,
  };
}

function bruteChance(wave: number, modifier: WaveModifier): number {
  if (modifier === "brute") return 0.22;
  if (wave >= 4) return 0.1;
  if (wave >= 2) return 0.04;
  return 0;
}

function runnerChance(wave: number, modifier: WaveModifier): number {
  if (modifier === "runners") return 0.55;
  if (wave >= 2) return 0.25;
  return 0.1;
}

export function pickSpawnKind(wave: number, modifier: WaveModifier, roll: number): ZombieKind {
  const bands = getSpawnBands(wave, modifier);
  if (roll < bands.brute) return "brute";
  if (roll < bands.brute + bands.runner) return "runner";
  if (roll < bands.brute + bands.runner + bands.bloater) return "bloater";
  if (roll < bands.brute + bands.runner + bands.bloater + bands.spitter) return "spitter";
  return "walker";
}

export function pickLiveKind(phase: WavePhase, wave: number, modifier: WaveModifier, roll: number): ZombieKind {
  const kind = pickSpawnKind(wave, modifier, roll);
  if (phase === "calm" && (kind === "bloater" || kind === "spitter")) return "walker";
  return kind;
}

export function spawnIntervalMs(wave: number): number {
  return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START - (wave - 1) * SPAWN_INTERVAL_STEP);
}

export function calmFill(secondsLeft: number, calmMs: number): number {
  if (calmMs <= 0) return 0;
  return Math.max(0, Math.min(1, secondsLeft / (calmMs / 1000)));
}

export function hordeSize(wave: number): number {
  return Math.min(SPAWN_CAP, SPAWN_BASE + wave * SPAWN_PER_WAVE);
}

export function maxAliveFor(wave: number): number {
  return hordeSize(wave);
}

export class WaveDirector {
  wave = 1;
  phase: WavePhase = "fight";
  spawned = 0;
  extras = 0;
  private phaseMs = 0;

  reset() {
    this.wave = 1;
    this.phase = "fight";
    this.phaseMs = 0;
    this.spawned = 0;
    this.extras = 0;
  }

  get modifier(): WaveModifier {
    return modifierFor(this.wave);
  }

  get roster(): number {
    return hordeSize(this.wave);
  }

  get pending(): number {
    return Math.max(0, this.roster - this.spawned);
  }

  get rosterFilled(): boolean {
    return this.spawned >= this.roster;
  }

  get extraRoom(): number {
    return Math.max(0, ALARM_EXTRA_CAP - this.extras);
  }

  get secondsLeft(): number {
    if (this.phase === "calm") return Math.max(0, (WAVE_CALM_MS - this.phaseMs) / 1000);
    return this.phaseMs / 1000;
  }

  get showingIntro(): boolean {
    return this.phase === "fight" && this.phaseMs < WAVE_BANNER_MS;
  }

  noteSpawn(count = 1): void {
    this.spawned += count;
  }

  noteExtra(count = 1): void {
    this.extras += count;
  }

  clear(): WaveEvent | null {
    if (this.phase !== "fight" || !this.rosterFilled) return null;
    this.phase = "calm";
    this.phaseMs = 0;
    return "calm-started";
  }

  advance(deltaMs: number): WaveEvent | null {
    this.phaseMs += deltaMs;
    if (this.phase === "fight") return null;
    if (this.phaseMs < WAVE_CALM_MS) return null;
    this.phaseMs -= WAVE_CALM_MS;
    this.wave += 1;
    this.phase = "fight";
    this.spawned = 0;
    this.extras = 0;
    return "fight-started";
  }
}
