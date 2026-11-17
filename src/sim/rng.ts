/**
 * Seeded random numbers. The whole simulation draws from an `Rng`, never from
 * `Math.random`, so the same seed, clock and inputs give the same catches.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Current internal state; store it in the save to resume the stream. */
  state(): number;
}

/** mulberry32: small, fast, and its whole state is one uint32. */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state() {
      return s;
    },
  };
}

export const range = (r: Rng, a: number, b: number): number => a + (b - a) * r.next();

/** Integer in [a, b], inclusive. */
export const int = (r: Rng, a: number, b: number): number => a + Math.floor(r.next() * (b - a + 1));

export const chance = (r: Rng, p: number): boolean => r.next() < p;

/** Standard normal via Box-Muller. */
export function normal(r: Rng): number {
  let u = 0;
  while (u < 1e-12) u = r.next();
  const v = r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(r.next() * items.length))];
}

/** Weighted draw. Returns null when the total weight is zero. */
export function weighted<T>(r: Rng, items: readonly T[], weight: (t: T) => number): T | null {
  let total = 0;
  for (const it of items) total += Math.max(0, weight(it));
  if (total <= 0) return null;
  let roll = r.next() * total;
  for (const it of items) {
    roll -= Math.max(0, weight(it));
    if (roll < 0) return it;
  }
  return items[items.length - 1] ?? null;
}

/** Stable string hash (FNV-1a), for deriving sub-seeds such as "today's flotsam". */
export function hashSeed(text: string, salt = 0): number {
  let h = (0x811c9dc5 ^ salt) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Standard normal CDF (Abramowitz-Stegun 7.1.26). */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
