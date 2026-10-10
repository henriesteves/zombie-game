// SFX 100% procedurais (Web Audio). Nenhum arquivo de áudio necessário.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let lastGroan = 0;
let lastHit = 0;
let alarmBusyUntil = 0;

/** Chame dentro de um gesto do usuário (clique/tecla). */
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
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
  burst({ dur: 0.15, vol: 0.7, f0: 5000, f1: 400 });
  tone({ type: "sine", f0: 180, f1: 40, dur: 0.12, vol: 0.8 });
}

export function smg() {
  burst({ dur: 0.09, vol: 0.5, f0: 4500, f1: 600 });
  tone({ type: "sine", f0: 150, f1: 50, dur: 0.07, vol: 0.5 });
}

export function shotgun() {
  burst({ dur: 0.35, vol: 0.95, f0: 3500, f1: 250 });
  tone({ type: "sine", f0: 120, f1: 30, dur: 0.25, vol: 1 });
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

export function hurt() {
  tone({ type: "square", f0: 220, f1: 80, dur: 0.14, vol: 0.35 });
  burst({ dur: 0.12, vol: 0.4, f0: 1200, f1: 200 });
}

export function pickup() {
  tone({ type: "sine", f0: 660, f1: 700, dur: 0.07, vol: 0.3 });
  tone({ type: "sine", f0: 990, f1: 1040, dur: 0.1, vol: 0.3, delay: 0.07 });
}

/** pitch < 1 = mais grave (brute). Limitado a 1 grunhido a cada 250 ms. */
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
    osc.frequency.setValueAtTime(s % 2 === 0 ? 900 : 700, t + s * 0.25);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.1, t);
  g.gain.setValueAtTime(0.1, t + seconds - 0.1);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + seconds);
}
