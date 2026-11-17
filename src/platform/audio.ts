/**
 * Audio, synthesised with WebAudio so the game ships no sound files yet.
 * Unlocked on the first tap; suspended when the page is hidden.
 */
export type Sfx =
  | 'tap' | 'cast' | 'plop' | 'nibble' | 'bite' | 'hook' | 'splash' | 'snap' | 'catch' | 'new' | 'trophy'
  | 'gain' | 'craft' | 'keep' | 'release' | 'page' | 'travel' | 'discover' | 'warn' | 'coin' | 'jump';

export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private reelGain: GainNode | null = null;
  private reelOsc: OscillatorNode | null = null;
  private noise: AudioBuffer | null = null;
  private crickets: GainNode | null = null;
  enabled = true;

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && this.enabled) void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.9 : 0;
    this.master.connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // pink-ish noise: sounds like surf rather than hiss
      last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = last * 6;
    }

    // ambient surf: looped noise through a slowly breathing low-pass
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    this.ambientFilter = ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.value = 500;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.0;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(this.ambientFilter.frequency);
    const swell = ctx.createGain();
    swell.gain.value = 0.05;
    lfo.connect(swell).connect(this.ambientGain.gain);
    src.connect(this.ambientFilter).connect(this.ambientGain).connect(this.master);
    src.start();
    lfo.start();

    // night insects: a high tone chopped by a fast LFO
    const cr = ctx.createOscillator();
    cr.type = 'sine';
    cr.frequency.value = 4300;
    const chop = ctx.createGain();
    chop.gain.value = 0;
    const chopLfo = ctx.createOscillator();
    chopLfo.type = 'square';
    chopLfo.frequency.value = 17;
    const chopAmt = ctx.createGain();
    chopAmt.gain.value = 0.5;
    chopLfo.connect(chopAmt).connect(chop.gain);
    this.crickets = ctx.createGain();
    this.crickets.gain.value = 0;
    cr.connect(chop).connect(this.crickets).connect(this.master);
    cr.start();
    chopLfo.start();

    // reel: a ratchet whose pitch follows tension
    this.reelOsc = ctx.createOscillator();
    this.reelOsc.type = 'square';
    this.reelOsc.frequency.value = 28;
    const reelFilter = ctx.createBiquadFilter();
    reelFilter.type = 'bandpass';
    reelFilter.frequency.value = 1800;
    reelFilter.Q.value = 2;
    this.reelGain = ctx.createGain();
    this.reelGain.gain.value = 0;
    this.reelOsc.connect(reelFilter).connect(this.reelGain).connect(this.master);
    this.reelOsc.start();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    if (this.enabled) void this.ctx?.resume();
  }

  /** Ambient bed. `sea` 0..1 is how much surf; `night` 0..1 fades in the insects. */
  ambient(sea: number, night: number): void {
    if (!this.ctx || !this.ambientGain || !this.crickets) return;
    const t = this.ctx.currentTime;
    this.ambientGain.gain.setTargetAtTime(0.05 + 0.14 * sea, t, 0.8);
    this.crickets.gain.setTargetAtTime(0.012 * night * (1 - 0.5 * sea), t, 1.5);
  }

  /** Reel ratchet. `speed` 0 silences it. */
  reel(speed: number, tension = 0): void {
    if (!this.ctx || !this.reelGain || !this.reelOsc) return;
    const t = this.ctx.currentTime;
    this.reelGain.gain.setTargetAtTime(speed > 0 ? 0.05 + 0.04 * tension : 0, t, 0.03);
    this.reelOsc.frequency.setTargetAtTime(18 + 30 * speed + 26 * tension, t, 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.2, slideTo?: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private burst(dur: number, freq: number, gain = 0.25, q = 0.8, delay = 0, sweepTo?: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t0);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0, Math.random());
    src.stop(t0 + dur + 0.05);
  }

  play(id: Sfx): void {
    if (!this.ctx || !this.enabled) return;
    switch (id) {
      case 'tap': this.tone(520, 0.06, 'triangle', 0.08); break;
      case 'cast': this.burst(0.35, 900, 0.22, 1.2, 0, 3200); break;
      case 'plop': this.tone(300, 0.14, 'sine', 0.3, 90); this.burst(0.2, 1400, 0.1, 0.7); break;
      case 'nibble': this.tone(880, 0.05, 'sine', 0.12, 700); break;
      case 'bite': this.tone(220, 0.22, 'sine', 0.4, 70); this.tone(1320, 0.09, 'triangle', 0.16); this.burst(0.25, 1000, 0.16, 0.7); break;
      case 'hook': this.tone(660, 0.08, 'triangle', 0.22); this.tone(990, 0.12, 'triangle', 0.2, undefined, 0.07); break;
      case 'splash': this.burst(0.5, 1200, 0.3, 0.5, 0, 400); break;
      case 'jump': this.burst(0.3, 2200, 0.25, 0.6, 0, 900); this.burst(0.5, 900, 0.28, 0.5, 0.35, 300); break;
      case 'snap': this.tone(1800, 0.09, 'sawtooth', 0.25, 200); this.burst(0.12, 3000, 0.2, 1); break;
      case 'catch': [523, 659, 784].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.18, undefined, i * 0.09)); break;
      case 'new': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.18, undefined, i * 0.1)); break;
      case 'trophy': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.2, undefined, i * 0.12)); this.tone(1568, 0.6, 'sine', 0.1, undefined, 0.6); break;
      case 'gain': this.tone(700, 0.07, 'triangle', 0.14); this.tone(1050, 0.1, 'triangle', 0.12, undefined, 0.05); break;
      case 'craft': this.burst(0.07, 700, 0.3, 2); this.burst(0.07, 900, 0.3, 2, 0.14); this.tone(880, 0.2, 'triangle', 0.14, undefined, 0.28); break;
      case 'keep': this.tone(440, 0.1, 'triangle', 0.16); this.tone(660, 0.14, 'triangle', 0.14, undefined, 0.08); break;
      case 'release': this.burst(0.4, 1000, 0.2, 0.6, 0, 500); this.tone(500, 0.3, 'sine', 0.1, 250); break;
      case 'page': this.burst(0.25, 2600, 0.14, 0.8, 0, 1400); this.tone(392, 0.5, 'sine', 0.12, undefined, 0.15); this.tone(587, 0.6, 'sine', 0.1, undefined, 0.4); break;
      case 'travel': this.burst(0.5, 500, 0.16, 0.5, 0, 1500); break;
      case 'discover': this.tone(784, 0.16, 'sine', 0.16); this.tone(1175, 0.3, 'sine', 0.14, undefined, 0.12); break;
      case 'warn': this.tone(240, 0.16, 'triangle', 0.18, 180); break;
      case 'coin': this.tone(1320, 0.07, 'square', 0.07); this.tone(1760, 0.16, 'square', 0.06, undefined, 0.06); break;
    }
  }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* optional extra; ignore */
    }
  }
}
