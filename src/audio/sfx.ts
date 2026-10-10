import { clampVolume, readVolume } from "./volume";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let lastGroan = 0;
let lastHit = 0;
let alarmBusyUntil = 0;
let hordeGain: GainNode | null = null;

/** Chame dentro de um gesto do usuário (clique/tecla). */
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = readVolume();
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMasterVolume(value: number) {
  if (!master) return;
  master.gain.value = clampVolume(value);
}

interface BurstOpts { dur: number; vol: number; f0: number; f1: number; type?: BiquadFilterType }

/** Rajada de ruído filtrado com envelope exponencial (estalo, explosão, impacto). */
function burst({ dur, vol, f0, f1, type = "lowpass" }: BurstOpts) {
  if (!ctx || !master || !noiseBuf) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * (1 - dur), dur);
}

interface ToneOpts { type: OscillatorType; f0: number; f1: number; dur: number; vol: number; delay?: number }

function tone({ type, f0, f1, dur, vol, delay = 0 }: ToneOpts) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function pistol() {
  burst({ dur: 0.11, vol: 0.5, f0: 2400, f1: 160 });
  tone({ type: "sine", f0: 130, f1: 32, dur: 0.13, vol: 0.85 });
}

export function smg() {
  burst({ dur: 0.05, vol: 0.35, f0: 2200, f1: 280 });
  tone({ type: "sine", f0: 100, f1: 36, dur: 0.05, vol: 0.5 });
}

export function shotgun() {
  burst({ dur: 0.26, vol: 0.85, f0: 1600, f1: 70 });
  tone({ type: "sine", f0: 64, f1: 26, dur: 0.26, vol: 1 });
  tone({ type: "triangle", f0: 160, f1: 40, dur: 0.1, vol: 0.35 });
}

export function rifle() {
  burst({ dur: 0.08, vol: 0.42, f0: 2800, f1: 220 });
  tone({ type: "sine", f0: 180, f1: 48, dur: 0.09, vol: 0.55 });
}

export function magnum() {
  burst({ dur: 0.18, vol: 0.7, f0: 900, f1: 80 });
  tone({ type: "sine", f0: 90, f1: 28, dur: 0.2, vol: 0.95 });
}

export function explosion() {
  burst({ dur: 0.9, vol: 1, f0: 1400, f1: 60 });
  tone({ type: "sine", f0: 80, f1: 25, dur: 0.8, vol: 1 });
}

export function click() {
  tone({ type: "square", f0: 900, f1: 600, dur: 0.04, vol: 0.15 });
}

export function hit() {
  const now = performance.now();
  if (now - lastHit < 40) return; // evita saturar com shotgun/SMG
  lastHit = now;
  burst({ dur: 0.07, vol: 0.45, f0: 900, f1: 200 });
}

export function heartbeat() {
  tone({ type: "sine", f0: 78, f1: 42, dur: 0.09, vol: 0.55 });
}

export function hurt() {
  tone({ type: "square", f0: 220, f1: 80, dur: 0.14, vol: 0.35 });
  burst({ dur: 0.12, vol: 0.4, f0: 1200, f1: 200 });
}

export function comboMark() {
  tone({ type: "sine", f0: 520, f1: 780, dur: 0.08, vol: 0.18 });
  tone({ type: "sine", f0: 780, f1: 1040, dur: 0.09, vol: 0.14, delay: 0.06 });
}

export function pickup() {
  tone({ type: "sine", f0: 660, f1: 700, dur: 0.07, vol: 0.3 });
  tone({ type: "sine", f0: 990, f1: 1040, dur: 0.1, vol: 0.3, delay: 0.07 });
}

export function setHordeLevel(level: number) {
  if (!ctx || !master) return;
  if (!hordeGain) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 46;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 140;
    hordeGain = ctx.createGain();
    hordeGain.gain.value = 0;
    osc.connect(filter).connect(hordeGain).connect(master);
    osc.start();
  }
  const amount = Math.min(1, Math.max(0, level)) * 0.09;
  hordeGain.gain.setTargetAtTime(amount, ctx.currentTime, 0.3);
}

export function bruteWindup() {
  tone({ type: "sawtooth", f0: 70, f1: 150, dur: 0.42, vol: 0.22 });
}

export function groan(pitch = 1) {
  if (!ctx || !master) return;
  const now = performance.now();
  if (now - lastGroan < 250) return;
  lastGroan = now;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(90 * pitch, t);
  osc.frequency.linearRampToValueAtTime(55 * pitch, t + 0.8);

  const lfo = ctx.createOscillator(); // vibrato
  lfo.frequency.value = 7;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 6;
  lfo.connect(lfoGain).connect(osc.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 300;
  filter.Q.value = 4;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.25, t + 0.1);
  g.gain.linearRampToValueAtTime(0, t + 0.8);

  osc.connect(filter).connect(g).connect(master);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.85);
  lfo.stop(t + 0.85);
}

/** Alarme de carro: alterna dois tons a cada 250 ms durante `seconds`. */
export function alarm(seconds = 6) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  if (t < alarmBusyUntil) return;
  alarmBusyUntil = t + seconds;
  const osc = ctx.createOscillator();
  osc.type = "square";
  for (let s = 0; s < seconds * 4; s++) {
    osc.frequency.setValueAtTime(s % 2 === 0 ? 480 : 360, t + s * 0.25);
  }
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.07, t);
  g.gain.setValueAtTime(0.07, t + seconds - 0.1);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  osc.connect(filter).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + seconds);
}
