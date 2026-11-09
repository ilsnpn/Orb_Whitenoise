// Moteur de paysage sonore génératif — TS pur, indépendant de React.
// Couches : nappe (accords), mélodie éparse, basse, pulsation, bruit texturé.
// Un scheduler à lookahead cadence tout sur le tempo ; "dynamism" règle le mouvement.
import { MODES, type Mix, type Mode, type ModeName, type Params } from './modes';

const LOOKAHEAD = 0.25; // s planifiées à l'avance (onglet visible)
const LOOKAHEAD_HIDDEN = 1.5; // onglet caché : le navigateur ralentit les timers, on prend de l'avance
const TICK_MS = 25;

// Horloge dans un Worker : moins bridée que setInterval quand l'onglet est en arrière-plan.
const CLOCK_SRC = `let id=null;onmessage=e=>{clearInterval(id);id=e.data?setInterval(()=>postMessage(0),${TICK_MS}):null}`;
const PAD_ATTACK = 2.5;
const PAD_RELEASE = 4;

// équilibre de base entre couches (le mix utilisateur reste 0…1)
const LAYER_TRIM: Record<keyof Mix, number> = {
  pad: 1,
  melody: 1.2,
  pulse: 1,
  bass: 1,
  noise: 0.5,
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

interface Voice { gain: GainNode; oscs: OscillatorNode[] }

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private reverbSend!: GainNode;
  private delay!: DelayNode;
  private delaySend!: GainNode;
  private layers!: Record<keyof Mix, GainNode>;
  private padFilter!: BiquadFilterNode;
  private noiseNode!: AudioWorkletNode;
  private noiseFilter!: BiquadFilterNode;
  private lfo!: OscillatorNode;
  private lfoPad!: GainNode;
  private lfoNoise!: GainNode;
  private hatBuffer!: AudioBuffer;

  private mode: Mode = MODES.relax;
  private params: Params = structuredClone(MODES.relax.params);
  private volume = 0.7;

  private clock: Worker | null = null;
  private running = false;
  private morph: { from: Params; to: Params; start: number; dur: number } | null = null;
  private step = 0;
  private nextTime = 0;
  private chordIndex = 0;
  private padVoices: Voice[] = [];
  private lastMelody = -1;
  private hits: { t: number; v: number }[] = []; // battements/notes planifiés, pour les visuels

  /** Enveloppe 0…1 des derniers battements et notes, à l'instant audio présent. */
  pulse(): number {
    if (!this.ctx || !this.running) return 0;
    const now = this.ctx.currentTime;
    while (this.hits.length > 1 && this.hits[1].t <= now) this.hits.shift();
    const h = this.hits[0];
    return h && h.t <= now ? h.v * Math.exp(-(now - h.t) / 0.2) : 0;
  }

  get isRunning() {
    return this.ctx?.state === 'running' && this.running;
  }

  private async init() {
    if (this.ctx) return;
    const ctx = new AudioContext({ latencyHint: 'playback' });
    await ctx.audioWorklet.addModule('/worklets/noise-processor.js');
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);

    // réverbe : réponse impulsionnelle générée (bruit à décroissance exponentielle)
    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulse(4.5);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.9;
    this.reverbSend.connect(reverb).connect(this.master);

    // écho synchronisé sur le tempo, filtré dans la boucle
    this.delay = ctx.createDelay(3);
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const fbFilter = ctx.createBiquadFilter();
    fbFilter.frequency.value = 2200;
    this.delay.connect(fbFilter).connect(fb).connect(this.delay);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.35;
    this.delaySend.connect(this.delay);
    fbFilter.connect(this.reverbSend);
    fbFilter.connect(this.bus);

    const mk = () => ctx.createGain();
    this.layers = { pad: mk(), melody: mk(), pulse: mk(), bass: mk(), noise: mk() };
    for (const g of Object.values(this.layers)) g.connect(this.bus);
    this.layers.pad.connect(this.reverbSend);
    this.layers.melody.connect(this.reverbSend);
    this.layers.melody.connect(this.delaySend);
    this.layers.pulse.connect(this.reverbSend);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.Q.value = 0.7;
    this.padFilter.connect(this.layers.pad);

    this.noiseNode = new AudioWorkletNode(ctx, 'noise-processor', {
      numberOfInputs: 0,
      outputChannelCount: [2],
    });
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseNode.connect(this.noiseFilter).connect(this.layers.noise);

    // un LFO lent fait « respirer » les filtres ; profondeur = dynamism
    this.lfo = ctx.createOscillator();
    this.lfoPad = ctx.createGain();
    this.lfoNoise = ctx.createGain();
    this.lfo.connect(this.lfoPad).connect(this.padFilter.frequency);
    this.lfo.connect(this.lfoNoise).connect(this.noiseFilter.frequency);
    this.lfo.start();

    this.hatBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const d = this.hatBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.clock = new Worker(URL.createObjectURL(new Blob([CLOCK_SRC], { type: 'text/javascript' })));
    this.clock.onmessage = () => this.tick();

    this.apply(true);
  }

  private makeImpulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  /** Applique les paramètres courants au graphe, en rampes douces. */
  private apply(immediate = false) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const tc = immediate ? 0.01 : 0.5;
    const p = this.params;

    for (const k of Object.keys(this.layers) as (keyof Mix)[]) {
      this.layers[k].gain.setTargetAtTime(p.mix[k] * LAYER_TRIM[k], t, tc);
    }
    const padCut = 350 + p.brightness * 3200;
    const noiseCut = 250 + p.brightness * 5000;
    this.padFilter.frequency.setTargetAtTime(padCut, t, tc);
    this.noiseFilter.frequency.setTargetAtTime(noiseCut, t, tc);
    this.lfo.frequency.setTargetAtTime(0.02 + p.dynamism * 0.18, t, tc);
    this.lfoPad.gain.setTargetAtTime(padCut * 0.7 * p.dynamism, t, tc);
    this.lfoNoise.gain.setTargetAtTime(noiseCut * 0.6 * p.dynamism, t, tc);
    this.delay.delayTime.setTargetAtTime((60 / p.tempo) * 0.75, t, tc);
    this.noiseNode.port.postMessage({ kind: p.noiseKind });
  }

  /** À appeler depuis un geste utilisateur (politique d'autoplay). */
  async play() {
    await this.init();
    const ctx = this.ctx!;
    await ctx.resume();
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.8);
    if (!this.running) {
      this.running = true;
      this.step = 0;
      this.nextTime = ctx.currentTime + 0.1;
      this.clock!.postMessage(true);
    }
  }

  async stop() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    this.clock!.postMessage(false);
    this.running = false;
    this.releasePad(ctx.currentTime + 2.5);
    await new Promise((r) => setTimeout(r, 3000));
    if (!this.running) await ctx.suspend();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx && this.running) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  /**
   * Met à jour les paramètres. Avec morphSeconds > 0 (et le son en cours),
   * glisse progressivement des valeurs actuelles vers les nouvelles.
   */
  setParams(patch: Partial<Params>, morphSeconds = 0) {
    const target = { ...this.params, ...patch, mix: { ...this.params.mix, ...patch.mix } };
    if (morphSeconds > 0 && this.running) {
      this.morph = { from: structuredClone(this.params), to: target, start: performance.now(), dur: morphSeconds * 1000 };
      return;
    }
    this.morph = null;
    this.params = target;
    this.apply();
  }

  /** Change d'ambiance (gamme + accords). Les paramètres arrivent via setParams. */
  setMode(name: ModeName) {
    if (this.mode === MODES[name]) return;
    this.mode = MODES[name];
    this.chordIndex = 0;
    this.lastMelody = -1;
    if (this.ctx && this.running) this.changeChord(this.ctx.currentTime + 0.1);
  }

  private stepMorph() {
    const m = this.morph;
    if (!m) return;
    const k = Math.min(1, (performance.now() - m.start) / m.dur);
    const e = k * k * (3 - 2 * k); // ease in-out
    const lerp = (a: number, b: number) => a + (b - a) * e;
    const mix = { ...m.to.mix };
    for (const key of Object.keys(mix) as (keyof Mix)[]) mix[key] = lerp(m.from.mix[key], m.to.mix[key]);
    this.params = {
      tempo: lerp(m.from.tempo, m.to.tempo),
      register: Math.round(lerp(m.from.register, m.to.register)),
      dynamism: lerp(m.from.dynamism, m.to.dynamism),
      brightness: lerp(m.from.brightness, m.to.brightness),
      noiseKind: e < 0.5 ? m.from.noiseKind : m.to.noiseKind,
      mix,
    };
    this.apply();
    if (k >= 1) this.morph = null;
  }

  // ───────────── séquenceur ─────────────

  private tick() {
    const ctx = this.ctx!;
    this.stepMorph();
    const ahead = typeof document !== 'undefined' && document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD;
    while (this.nextTime < ctx.currentTime + ahead) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += 60 / this.params.tempo / 4; // pas = double-croche
      this.step++;
    }
  }

  private scheduleStep(step: number, t: number) {
    const p = this.params;
    const dyn = p.dynamism;
    const s16 = step % 16;
    const bar = Math.floor(step / 16);
    const barsPerChord = Math.max(1, Math.round(4 - 2 * dyn));

    if (s16 === 0 && bar % barsPerChord === 0) {
      if (bar > 0) this.advanceChord();
      this.changeChord(t);
      this.playBass(t, (60 / p.tempo) * 4 * barsPerChord);
    }

    // pulsation : battement doux sur les temps, ticks sur les contretemps
    if (s16 % 4 === 0) {
      const strong = s16 === 0 || (s16 === 8 && dyn > 0.3);
      if (strong || Math.random() < dyn * 0.5) this.playKick(t, strong ? 1 : 0.5);
    } else if (s16 % 2 === 0 && Math.random() < 0.2 + dyn * 0.6) {
      this.playHat(t, 0.5 + Math.random() * 0.5);
    } else if (dyn > 0.6 && Math.random() < (dyn - 0.6) * 0.5) {
      this.playHat(t, 0.25);
    }

    // mélodie éparse sur les croches ; densité = dynamism
    if (step % 2 === 0 && Math.random() < 0.08 + dyn * 0.35) this.playMelody(t);
  }

  private advanceChord() {
    const n = this.mode.chords.length;
    if (Math.random() < this.params.dynamism * 0.5) this.chordIndex = Math.floor(Math.random() * n);
    else this.chordIndex = (this.chordIndex + 1) % n;
  }

  private get root() {
    return this.mode.root + this.params.register;
  }

  // ───────────── voix ─────────────

  private releasePad(at: number) {
    for (const v of this.padVoices) {
      v.gain.gain.cancelScheduledValues(at);
      v.gain.gain.setTargetAtTime(0, at, PAD_RELEASE / 4);
      for (const o of v.oscs) o.stop(at + PAD_RELEASE * 1.5);
    }
    this.padVoices = [];
  }

  private changeChord(t: number) {
    const ctx = this.ctx!;
    this.releasePad(t);
    const chord = this.mode.chords[this.chordIndex];
    const level = 0.12 / Math.sqrt(chord.length);
    for (const iv of chord) {
      const f = mtof(this.root + iv);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + PAD_ATTACK);
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.2 - 0.6;
      gain.connect(pan).connect(this.padFilter);
      const oscs: OscillatorNode[] = [];
      for (const [type, detune, amp] of [
        ['triangle', -6, 1],
        ['sawtooth', 7, 0.35],
        ['sine', 0, 0.6],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = type === 'sine' ? f / 2 : f;
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g).connect(gain);
        o.start(t);
        oscs.push(o);
      }
      this.padVoices.push({ gain, oscs });
    }
  }

  private playMelody(t: number) {
    const ctx = this.ctx!;
    const dyn = this.params.dynamism;
    const chord = this.mode.chords[this.chordIndex];
    // préfère les notes de l'accord, sinon la gamme ; évite les grands sauts
    const pool = Math.random() < 0.6 ? chord.map((c) => ((c % 12) + 12) % 12) : this.mode.scale;
    const octave = 12 + (Math.random() < dyn * 0.3 ? 12 : 0);
    let note = this.root + octave + pick(pool);
    if (this.lastMelody > 0 && Math.abs(note - this.lastMelody) > 9 && Math.random() < 0.7) {
      note += note > this.lastMelody ? -12 : 12;
    }
    this.lastMelody = note;
    this.hits.push({ t, v: 0.35 * Math.min(1, this.params.mix.melody * 2) });

    const f = mtof(note);
    const vel = 0.05 + Math.random() * 0.05;
    const decay = 1.5 + Math.random() * 2.5 * (1 - dyn * 0.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const tone = ctx.createBiquadFilter();
    tone.frequency.value = 1200 + this.params.brightness * 4000;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.4 - 0.7;
    env.connect(tone).connect(pan).connect(this.layers.melody);
    for (const [mult, amp, type] of [
      [1, 1, 'sine'],
      [2, 0.25, 'triangle'],
      [3.01, 0.08, 'sine'],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      const g = ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(env);
      o.start(t);
      o.stop(t + decay + 0.1);
    }
  }

  private playBass(t: number, dur: number) {
    const ctx = this.ctx!;
    const chord = this.mode.chords[this.chordIndex];
    let n = this.root + chord[0] - 12;
    while (n > 50) n -= 12;
    const o = ctx.createOscillator();
    o.frequency.value = mtof(n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 1.5);
    g.gain.setValueAtTime(0.25, t + Math.max(1.6, dur - 1.5));
    g.gain.linearRampToValueAtTime(0, t + dur + 0.5);
    o.connect(g).connect(this.layers.bass);
    o.start(t);
    o.stop(t + dur + 0.6);
  }

  private playKick(t: number, vel: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g).connect(this.layers.pulse);
    o.start(t);
    o.stop(t + 0.5);
    this.hits.push({ t, v: vel * Math.min(1, this.params.mix.pulse * 2) });
  }

  private playHat(t: number, vel: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.hatBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5000 + this.params.brightness * 4000;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + Math.random() * 0.03);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 0.8 - 0.4;
    src.connect(bp).connect(g).connect(pan).connect(this.layers.pulse);
    src.start(t);
  }
}
