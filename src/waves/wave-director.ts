import {
  BLOATER_CHANCE, SPAWN_BASE, SPAWN_CAP, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START, SPAWN_INTERVAL_STEP, SPAWN_PER_WAVE,
  WAVE_BANNER_MS, WAVE_CALM_MS, WAVE_FIGHT_MS, type ZombieKind,
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

export interface SpawnBands {
  brute: number;
  runner: number;
  bloater: number;
}

export function getSpawnBands(wave: number, modifier: WaveModifier): SpawnBands {
  return {
    brute: bruteChance(wave, modifier),
    runner: runnerChance(wave, modifier),
    bloater: wave >= 3 ? BLOATER_CHANCE : 0,
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
  return "walker";
}

export function pickLiveKind(phase: WavePhase, wave: number, modifier: WaveModifier, roll: number): ZombieKind {
  const kind = pickSpawnKind(wave, modifier, roll);
  if (phase === "calm" && kind === "bloater") return "walker";
  return kind;
}

export function spawnIntervalMs(wave: number): number {
  return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START - (wave - 1) * SPAWN_INTERVAL_STEP);
}

export function maxAliveFor(wave: number): number {
  return Math.min(SPAWN_CAP, SPAWN_BASE + wave * SPAWN_PER_WAVE);
}

export class WaveDirector {
  wave = 1;
  phase: WavePhase = "fight";
  private phaseMs = 0;

  reset() {
    this.wave = 1;
    this.phase = "fight";
    this.phaseMs = 0;
  }

  get modifier(): WaveModifier {
    return modifierFor(this.wave);
  }

  get secondsLeft(): number {
    const limit = this.phase === "fight" ? WAVE_FIGHT_MS : WAVE_CALM_MS;
    return Math.max(0, (limit - this.phaseMs) / 1000);
  }

  get showingIntro(): boolean {
    return this.phase === "fight" && this.phaseMs < WAVE_BANNER_MS;
  }

  advance(deltaMs: number): WaveEvent | null {
    this.phaseMs += deltaMs;
    const limit = this.phase === "fight" ? WAVE_FIGHT_MS : WAVE_CALM_MS;
    if (this.phaseMs < limit) return null;
    this.phaseMs -= limit;
    if (this.phase === "fight") {
      this.phase = "calm";
      return "calm-started";
    }
    this.wave += 1;
    this.phase = "fight";
    return "fight-started";
  }
}
