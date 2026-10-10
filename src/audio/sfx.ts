import { clampVolume, readVolume } from "./volume";

const COMPRESSOR_THRESHOLD = -18;
const COMPRESSOR_KNEE = 12;
const COMPRESSOR_RATIO = 6;
const COMPRESSOR_ATTACK = 0.003;
const COMPRESSOR_RELEASE = 0.18;
const PITCH_JITTER = 0.06;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let lastGroan = 0;
let lastHit = 0;
let alarmBusyUntil = 0;
let hordeGain: GainNode | null = null;

export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    const route = createRoute(ctx, readVolume());
    master = route.master;
    bus = route.bus;
    noiseBuf = createNoise(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function createRoute(context: AudioContext, volume: number): { bus: GainNode; master: GainNode } {
  const masterGain = context.createGain();
  masterGain.gain.value = volume;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = COMPRESSOR_THRESHOLD;
  compressor.knee.value = COMPRESSOR_KNEE;
  compressor.ratio.value = COMPRESSOR_RATIO;
  compressor.attack.value = COMPRESSOR_ATTACK;
  compressor.release.value = COMPRESSOR_RELEASE;
  const busGain = context.createGain();
  busGain.connect(compressor);
  compressor.connect(masterGain);
  masterGain.connect(context.destination);
  return { bus: busGain, master: masterGain };
}

function createNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function setMasterVolume(value: number) {
  if (!master) return;
  master.gain.value = clampVolume(value);
}

interface BurstOpts { dur: number; vol: number; f0: number; f1: number; type?: BiquadFilterType }

/** Rajada de ruído filtrado com envelope exponencial (estalo, explosão, impacto). */
function burst({ dur, vol, f0, f1, type = "lowpass" }: BurstOpts) {
  if (!ctx || !bus || !noiseBuf) return;
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
  src.connect(filter).connect(g).connect(bus);
  src.start(t, Math.random() * (1 - dur), dur);
}

interface ToneOpts { type: OscillatorType; f0: number; f1: number; dur: number; vol: number; delay?: number }

function tone({ type, f0, f1, dur, vol, delay = 0 }: ToneOpts) {
  if (!ctx || !bus) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(bus);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

interface NoiseLayer { dur: number; vol: number; f0: number; f1: number; type?: BiquadFilterType }
interface ToneLayer { dur: number; vol: number; f0: number; f1: number; type?: OscillatorType }
interface ShotVoice { crack: NoiseLayer; body: NoiseLayer; thump: ToneLayer; ring?: ToneLayer }

function pitchScale(): number {
  return 1 + (Math.random() * 2 - 1) * PITCH_JITTER;
}

function scaledFreq(freq: number, scale: number): number {
  return Math.max(20, freq * scale);
}

function shot(voice: ShotVoice): void {
  const scale = pitchScale();
  const crack = voice.crack;
  burst({ dur: crack.dur, vol: crack.vol, f0: scaledFreq(crack.f0, scale), f1: scaledFreq(crack.f1, scale), type: crack.type ?? "highpass" });
  const body = voice.body;
  burst({ dur: body.dur, vol: body.vol, f0: scaledFreq(body.f0, scale), f1: scaledFreq(body.f1, scale), type: body.type ?? "lowpass" });
  const thump = voice.thump;
  tone({ type: thump.type ?? "sine", f0: scaledFreq(thump.f0, scale), f1: scaledFreq(thump.f1, scale), dur: thump.dur, vol: thump.vol });
  const ring = voice.ring;
  if (!ring) return;
  tone({ type: ring.type ?? "triangle", f0: scaledFreq(ring.f0, scale), f1: scaledFreq(ring.f1, scale), dur: ring.dur, vol: ring.vol });
}

export function pistol() {
  shot({
    crack: { dur: 0.02, vol: 0.24, f0: 4200, f1: 1800 },
    body: { dur: 0.08, vol: 0.3, f0: 1800, f1: 220 },
    thump: { dur: 0.09, vol: 0.42, f0: 150, f1: 40 },
  });
}

export function smg() {
  shot({
    crack: { dur: 0.012, vol: 0.16, f0: 5000, f1: 2200 },
    body: { dur: 0.035, vol: 0.18, f0: 2400, f1: 500 },
    thump: { dur: 0.04, vol: 0.2, f0: 110, f1: 48 },
  });
}

export function shotgun() {
  shot({
    crack: { dur: 0.03, vol: 0.28, f0: 2500, f1: 600 },
    body: { dur: 0.2, vol: 0.5, f0: 900, f1: 70 },
    thump: { dur: 0.22, vol: 0.58, f0: 58, f1: 24 },
  });
}

export function rifle() {
  shot({
    crack: { dur: 0.02, vol: 0.2, f0: 4800, f1: 2000 },
    body: { dur: 0.06, vol: 0.24, f0: 2600, f1: 280 },
    thump: { dur: 0.07, vol: 0.3, f0: 170, f1: 50 },
    ring: { dur: 0.05, vol: 0.1, f0: 1600, f1: 700 },
  });
}

export function magnum() {
  shot({
    crack: { dur: 0.025, vol: 0.18, f0: 1400, f1: 400 },
    body: { dur: 0.1, vol: 0.28, f0: 600, f1: 90 },
    thump: { dur: 0.2, vol: 0.62, f0: 72, f1: 22 },
  });
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
  if (!ctx || !bus) return;
  if (!hordeGain) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 46;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 140;
    hordeGain = ctx.createGain();
    hordeGain.gain.value = 0;
    osc.connect(filter).connect(hordeGain).connect(bus);
    osc.start();
  }
  const amount = Math.min(1, Math.max(0, level)) * 0.09;
  hordeGain.gain.setTargetAtTime(amount, ctx.currentTime, 0.3);
}

export function bruteWindup() {
  tone({ type: "sawtooth", f0: 70, f1: 150, dur: 0.42, vol: 0.22 });
}

export function groan(pitch = 1) {
  if (!ctx || !bus) return;
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

  osc.connect(filter).connect(g).connect(bus);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.85);
  lfo.stop(t + 0.85);
}

/** Alarme de carro: alterna dois tons a cada 250 ms durante `seconds`. */
export function alarm(seconds = 6) {
  if (!ctx || !bus) return;
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
  osc.connect(filter).connect(g).connect(bus);
  osc.start(t);
  osc.stop(t + seconds);
}
