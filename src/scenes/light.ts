/**
 * Colour and light. Scenes are painted in neutral midday colours and shaded
 * here for dawn, dusk and night, driven by the real sun at the location.
 */
import type { SunInfo } from '../sim/time';

export type RGB = [number, number, number];

const hexCache = new Map<string, RGB>();

export function rgb(hex: string): RGB {
  let c = hexCache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(hex, c);
  }
  return c;
}

export const css = (c: RGB, a = 1): string => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);

export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

interface Key {
  e: number;
  skyTop: string;
  skyBot: string;
  tint: string;
  /** Colour of the glow around the sun and on the water. */
  glow: string;
}

// Keyframes by sun elevation: -1 deep night, 0 on the horizon, 1 full day.
const KEYS: Key[] = [
  { e: -1, skyTop: '#0a1232', skyBot: '#1f3168', tint: '#5568a8', glow: '#9fb2e6' },
  { e: -0.4, skyTop: '#1b2456', skyBot: '#5a4f8c', tint: '#7480ba', glow: '#c2b0dc' },
  { e: 0, skyTop: '#41579f', skyBot: '#ff9a62', tint: '#f2ad8c', glow: '#ffb46a' },
  { e: 0.3, skyTop: '#4f8fd6', skyBot: '#ffdca8', tint: '#ffe7c8', glow: '#fff0c0' },
  { e: 1, skyTop: '#2f86d8', skyBot: '#bfe6f6', tint: '#ffffff', glow: '#ffffff' },
];

export interface Light {
  e: number;
  dayFrac: number;
  skyTop: RGB;
  skyBot: RGB;
  tint: RGB;
  glow: RGB;
  /** 0 by day, 1 in deep night. */
  night: number;
  /** A warm light near the angler: torch or lantern. */
  torch: boolean;
  /** Shade a midday colour for the current light. */
  shade(hex: string, alpha?: number): string;
  /** Shade, then lighten toward the sky colour (for distance haze). */
  haze(hex: string, amount: number): string;
}

export function lightFor(sun: Pick<SunInfo, 'elevation' | 'dayFrac'>, torch = false): Light {
  const e = sun.elevation;
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (e >= KEYS[i].e && e <= KEYS[i + 1].e) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const t = b.e === a.e ? 0 : (e - a.e) / (b.e - a.e);
  const tint = mix(rgb(a.tint), rgb(b.tint), t);
  const skyBot = mix(rgb(a.skyBot), rgb(b.skyBot), t);
  const cache = new Map<string, RGB>();
  const shaded = (hex: string): RGB => {
    let c = cache.get(hex);
    if (!c) {
      const s = rgb(hex);
      c = [(s[0] * tint[0]) / 255, (s[1] * tint[1]) / 255, (s[2] * tint[2]) / 255];
      cache.set(hex, c);
    }
    return c;
  };
  return {
    e,
    dayFrac: sun.dayFrac,
    skyTop: mix(rgb(a.skyTop), rgb(b.skyTop), t),
    skyBot,
    tint,
    glow: mix(rgb(a.glow), rgb(b.glow), t),
    night: Math.max(0, Math.min(1, -e)),
    torch,
    shade: (hex, alpha = 1) => css(shaded(hex), alpha),
    haze: (hex, amount) => css(mix(shaded(hex), skyBot, amount)),
  };
}

/** Deterministic pseudo-random for decoration, so scenery does not shimmer between frames. */
export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
