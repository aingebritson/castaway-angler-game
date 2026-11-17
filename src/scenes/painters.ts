/**
 * Placeholder scene art, painted in code: sky, sea, land and props for every
 * location. Each painter draws a neutral midday scene; `Light` shades it for
 * the real time of day. When a real background image exists in the art
 * manifest the engine draws that instead and keeps only the animated water.
 */
import { type Light, css, hash01, mix, rgb } from './light';

type G = CanvasRenderingContext2D;

export interface SceneInfo {
  has(itemId: string): boolean;
  flag(name: string): boolean;
  rackCount: number;
  rackSlots: number;
  moon: number;
}

export interface P {
  g: G;
  W: number;
  H: number;
  /** Seconds, for animation. */
  t: number;
  L: Light;
  info: SceneInfo;
}

export interface Painter {
  /** Normalised y of the horizon; water begins here. 0 for scenes without sea. */
  horizon: number;
  /** Water gradient, far to near. */
  water: string[];
  paint(p: P): void;
  /** Drawn over the water effects: foreground land the line passes behind. */
  front?(p: P): void;
}

// ---------- toolkit ----------

function poly(g: G, W: number, H: number, pts: number[][]): void {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)));
  g.closePath();
}

function blob(g: G, W: number, H: number, pts: number[][]): void {
  // Smooth closed shape through the midpoints of a control polygon.
  g.beginPath();
  const n = pts.length;
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  g.moveTo(m0[0] * W, m0[1] * H);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    g.quadraticCurveTo(pts[i][0] * W, pts[i][1] * H, m[0] * W, m[1] * H);
  }
  g.closePath();
}

export function sky(p: P, horizon: number): void {
  const { g, W, H, L, t } = p;
  const hy = horizon * H;
  const grad = g.createLinearGradient(0, 0, 0, hy);
  grad.addColorStop(0, css(L.skyTop));
  grad.addColorStop(1, css(L.skyBot));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, hy + 2);

  // stars
  if (L.night > 0.15) {
    g.fillStyle = '#fff';
    for (let i = 0; i < 70; i++) {
      const x = hash01(i * 3.1) * W;
      const y = hash01(i * 7.7) * hy * 0.92;
      const tw = 0.55 + 0.45 * Math.sin(t * (0.6 + hash01(i) * 1.6) + i);
      g.globalAlpha = Math.min(1, (L.night - 0.15) * 1.6) * tw * (0.35 + 0.65 * hash01(i * 1.3));
      const r = 0.6 + hash01(i * 9.1) * 1.1;
      g.fillRect(x, y, r, r);
    }
    g.globalAlpha = 1;
  }

  // sun: rises on the left, sets on the right
  const f = L.dayFrac;
  if (f > -0.06 && f < 1.06) {
    const sx = (0.12 + 0.76 * f) * W;
    const sy = hy - Math.sin(Math.PI * Math.max(0, Math.min(1, f))) * hy * 0.82 + (f < 0 || f > 1 ? hy * 0.06 : 0);
    const r = W * (0.05 + 0.02 * (1 - Math.min(1, Math.max(0, L.e))));
    const halo = g.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 6);
    halo.addColorStop(0, css(L.glow, 0.55));
    halo.addColorStop(1, css(L.glow, 0));
    g.fillStyle = halo;
    g.fillRect(0, 0, W, hy);
    g.fillStyle = css(mix(L.glow, [255, 255, 255], 0.5));
    g.beginPath();
    g.arc(sx, sy, r, 0, 7);
    g.fill();
  } else {
    // moon, with its real phase
    const nf = f < 0 ? 1 + f : f - 1; // rough night progress
    const mx = (0.2 + 0.6 * ((nf % 1) + 1) % 1) * W;
    const my = hy * (0.3 - 0.12 * Math.sin(Math.PI * (((nf % 1) + 1) % 1)));
    const r = W * 0.045;
    const ph = p.info.moon;
    const lit = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
    const halo = g.createRadialGradient(mx, my, r, mx, my, r * 5);
    halo.addColorStop(0, `rgba(190,205,255,${0.1 + 0.25 * lit})`);
    halo.addColorStop(1, 'rgba(190,205,255,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, W, hy);
    g.save();
    g.beginPath();
    g.arc(mx, my, r, 0, 7);
    g.clip();
    g.fillStyle = '#20284a';
    g.fillRect(mx - r, my - r, r * 2, r * 2);
    g.fillStyle = '#f2f0e2';
    g.beginPath();
    // lit limb: a half disc plus or minus an ellipse
    const waxing = ph < 0.5;
    g.arc(mx, my, r, waxing ? -Math.PI / 2 : Math.PI / 2, waxing ? Math.PI / 2 : -Math.PI / 2);
    const k = Math.cos(ph * 2 * Math.PI); // 1 new, -1 full
    g.ellipse(mx, my, Math.abs(k) * r, r, 0, waxing ? Math.PI / 2 : -Math.PI / 2, waxing ? -Math.PI / 2 : Math.PI / 2, (k > 0) === waxing);
    g.fill();
    g.restore();
  }

  // clouds
  for (let i = 0; i < 5; i++) {
    const cw = W * (0.22 + 0.2 * hash01(i * 5.3));
    const span = W + cw * 2;
    const x = ((hash01(i * 2.9) * span + t * (3 + i * 1.3)) % span) - cw;
    const y = hy * (0.14 + 0.6 * hash01(i * 4.1));
    const lit = mix(mix(L.skyBot, [255, 255, 255], 0.55 * (1 - L.night)), L.glow, 0.25);
    g.fillStyle = css(lit, 0.5 - 0.3 * L.night);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(x + cw * (0.2 + k * 0.2), y + (k % 2) * cw * 0.03, cw * (0.2 + 0.05 * (k % 2)), cw * (0.06 + 0.02 * ((k + i) % 2)), 0, 0, 7);
      g.fill();
    }
  }
}

/** Sea from y0 to y1 with animated glints. `stops` are midday colours, far to near. */
export function sea(p: P, y0: number, y1: number, stops: string[]): void {
  const { g, W, H, L, t } = p;
  const a = y0 * H;
  const b = y1 * H;
  const grad = g.createLinearGradient(0, a, 0, b);
  stops.forEach((c, i) => {
    const pos = i / (stops.length - 1);
    // the far water takes on the colour of the sky above it
    grad.addColorStop(pos, i === 0 ? L.haze(c, 0.35) : L.shade(c));
  });
  g.fillStyle = grad;
  g.fillRect(0, a - 1, W, b - a + 2);

  // sun or moon path on the water
  const f = L.dayFrac;
  const low = L.e < 0.45 && L.e > -0.5 && f > -0.1 && f < 1.1;
  if (low || L.night > 0.6) {
    const gx = low ? (0.12 + 0.76 * Math.max(0, Math.min(1, f))) * W : 0.5 * W;
    const col = low ? L.glow : ([200, 212, 255] as [number, number, number]);
    for (let i = 0; i < 26; i++) {
      const k = i / 26;
      const y = a + (b - a) * Math.pow(k, 1.5);
      const w = W * (0.02 + 0.16 * k) * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7));
      g.fillStyle = css(col, (low ? 0.4 : 0.14) * (1 - k * 0.7));
      g.fillRect(gx - w / 2 + Math.sin(t * 1.3 + i) * W * 0.01, y, w, Math.max(1, H * 0.002 * (1 + k * 2)));
    }
  }

  // wave glints
  const rows = 22;
  g.lineCap = 'round';
  for (let i = 0; i < rows; i++) {
    const k = (i + 0.5) / rows;
    const y = a + (b - a) * Math.pow(k, 1.7);
    const n = 3;
    for (let j = 0; j < n; j++) {
      const seed = i * 13 + j * 71;
      const speed = (4 + 10 * k) * (hash01(seed) > 0.5 ? 1 : -1);
      const span = W * 1.3;
      const x = (((hash01(seed * 1.7) * span + t * speed) % span) + span) % span - W * 0.15;
      const len = W * (0.03 + 0.09 * k) * (0.5 + hash01(seed * 2.3));
      const alpha = (0.1 + 0.16 * k) * (0.5 + 0.5 * Math.sin(t * 1.4 + seed)) * (1 - 0.6 * L.night);
      g.strokeStyle = `rgba(255,255,255,${alpha})`;
      g.lineWidth = Math.max(1, H * 0.0016 * (1 + 2 * k));
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + len / 2, y - H * 0.004 * (1 + k), x + len, y);
      g.stroke();
    }
  }
}

function palm(p: P, x: number, y: number, h: number, lean: number, seed: number, scale = 1): void {
  const { g, W, H, L, t } = p;
  const bx = x * W;
  const by = y * H;
  const tx = (x + lean) * W;
  const ty = (y - h) * H;
  const cx = (x + lean * 0.2) * W;
  const cy = (y - h * 0.6) * H;
  const tw = W * 0.03 * scale;
  g.lineCap = 'round';
  g.strokeStyle = L.shade('#6b5138');
  g.lineWidth = tw;
  g.beginPath();
  g.moveTo(bx, by);
  g.quadraticCurveTo(cx, cy, tx, ty);
  g.stroke();
  g.strokeStyle = L.shade('#8a6c4a');
  g.lineWidth = tw * 0.35;
  g.beginPath();
  g.moveTo(bx - tw * 0.2, by);
  g.quadraticCurveTo(cx - tw * 0.2, cy, tx - tw * 0.15, ty);
  g.stroke();
  // fronds
  const sway = Math.sin(t * 0.8 + seed) * 0.05;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (0.02 + (i / (n - 1)) * 0.96) + sway + (hash01(seed + i) - 0.5) * 0.2;
    const len = W * 0.2 * scale * (0.75 + 0.4 * hash01(seed * 3 + i));
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.7 + len * 0.42;
    const mx = tx + Math.cos(a) * len * 0.55;
    const my = ty + Math.sin(a) * len * 0.75 - len * 0.05;
    g.fillStyle = L.shade(i % 2 ? '#3f7d3c' : '#2f6a36');
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(mx, my - len * 0.1, ex, ey);
    g.quadraticCurveTo(mx, my + len * 0.16, tx, ty);
    g.fill();
  }
  g.fillStyle = L.shade('#5a4026');
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(tx + (i - 1) * tw * 0.5, ty + tw * 0.45, tw * 0.33, 0, 7);
    g.fill();
  }
}

function rock(p: P, pts: number[][], base = '#3f3b43', topc = '#5d5762'): void {
  const { g, W, H, L } = p;
  g.fillStyle = L.shade(base);
  poly(g, W, H, pts);
  g.fill();
  // lit top facet: the upper edge, pulled down a little
  const cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const upper = pts.filter((q) => q[1] < cy);
  if (upper.length >= 2) {
    g.fillStyle = L.shade(topc);
    const lower = [...upper].reverse().map(([x, y]) => [x, y + (cy - y) * 0.45]);
    poly(g, W, H, [...upper, ...lower]);
    g.fill();
  }
}

function foam(p: P, x0: number, x1: number, y: number, amp = 0.006): void {
  const { g, W, H, t, L } = p;
  g.strokeStyle = `rgba(255,255,255,${0.75 - 0.4 * L.night})`;
  g.lineWidth = Math.max(1.5, H * 0.004);
  g.lineCap = 'round';
  g.beginPath();
  for (let i = 0; i <= 24; i++) {
    const x = x0 + ((x1 - x0) * i) / 24;
    const yy = y + Math.sin(i * 0.9 + t * 1.6) * amp + Math.sin(i * 2.3 - t) * amp * 0.5;
    if (i) g.lineTo(x * W, yy * H);
    else g.moveTo(x * W, yy * H);
  }
  g.stroke();
}

function patches(p: P, items: number[][], color: string, alpha: number): void {
  const { g, W, H, L } = p;
  g.fillStyle = L.shade(color, alpha);
  for (const [x, y, rx, ry] of items) {
    g.beginPath();
    g.ellipse(x * W, y * H, rx * W, ry * H, 0, 0, 7);
    g.fill();
  }
}

function hills(p: P, pts: number[][], color: string, haze = 0.45): void {
  const { g, W, H, L } = p;
  g.fillStyle = L.haze(color, haze);
  blob(g, W, H, pts);
  g.fill();
}

function flame(p: P, x: number, y: number, size: number): void {
  const { g, W, H, t } = p;
  const s = size * W;
  for (let i = 0; i < 3; i++) {
    const flick = Math.sin(t * (7 + i * 3) + i) * 0.12;
    const h = s * (1.5 - i * 0.35) * (1 + flick);
    const w = s * (0.75 - i * 0.2);
    g.fillStyle = ['#ff7a1a', '#ffb52e', '#fff1a8'][i];
    g.beginPath();
    g.moveTo(x * W - w, y * H);
    g.quadraticCurveTo(x * W - w * 0.9, y * H - h * 0.5, x * W + flick * s, y * H - h);
    g.quadraticCurveTo(x * W + w * 0.9, y * H - h * 0.5, x * W + w, y * H);
    g.fill();
  }
}

/** A pool of warm light, for fires and torches at night. */
export function glow(g: G, x: number, y: number, r: number, strength: number, color = '255,170,80'): void {
  if (strength <= 0) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${color},${0.5 * strength})`);
  grad.addColorStop(0.5, `rgba(${color},${0.18 * strength})`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

// ---------- scenes ----------

const rockyPoint: Painter = {
  horizon: 0.42,
  water: ['#154a8a', '#1d6fa8', '#2d9cb4', '#56c8bd', '#7adcc4'],
  paint(p) {
    sky(p, this.horizon);
    hills(p, [[0.6, 0.425], [0.68, 0.39], [0.8, 0.372], [0.93, 0.385], [1.05, 0.38], [1.05, 0.43]], '#3d6b4c');
    hills(p, [[0.06, 0.425], [0.12, 0.408], [0.2, 0.412], [0.25, 0.425]], '#3d6b4c', 0.6);
    sea(p, this.horizon, 1, this.water);
    // the reef edge reads as dark coral heads; the shallows as pale sand and rubble
    patches(p, [[0.2, 0.555, 0.09, 0.012], [0.5, 0.57, 0.12, 0.014], [0.8, 0.56, 0.1, 0.012], [0.35, 0.6, 0.08, 0.013], [0.68, 0.61, 0.09, 0.013]], '#0f3f52', 0.3);
    patches(p, [[0.3, 0.74, 0.12, 0.02], [0.66, 0.78, 0.14, 0.022], [0.5, 0.86, 0.16, 0.02]], '#d8f0d0', 0.16);
    patches(p, [[0.42, 0.7, 0.05, 0.012], [0.74, 0.69, 0.04, 0.01], [0.58, 0.8, 0.045, 0.011]], '#1d5a55', 0.28);
  },
  front(p) {
    const { g, W, H, L, t } = p;
    foam(p, 0, 0.3, 0.745);
    foam(p, 0.74, 1, 0.775);
    rock(p, [[-0.02, 0.75], [0.06, 0.725], [0.15, 0.735], [0.24, 0.765], [0.29, 0.82], [0.26, 0.9], [0.3, 1.02], [-0.02, 1.02]]);
    rock(p, [[0.74, 0.8], [0.8, 0.765], [0.9, 0.75], [1.02, 0.77], [1.02, 1.02], [0.7, 1.02], [0.72, 0.9]], '#39353d', '#56505b');
    rock(p, [[0.2, 0.93], [0.36, 0.905], [0.56, 0.9], [0.74, 0.915], [0.86, 0.95], [0.86, 1.02], [0.2, 1.02]], '#34313a', '#514b57');
    // tide pools
    for (const [x, y, rx, ry] of [[0.1, 0.8, 0.05, 0.012], [0.17, 0.845, 0.035, 0.009]]) {
      g.fillStyle = L.shade('#6fc6cf');
      g.beginPath();
      g.ellipse(x * W, y * H, rx * W, ry * H, 0, 0, 7);
      g.fill();
      g.fillStyle = `rgba(255,255,255,${0.25 + 0.15 * Math.sin(t * 2 + x * 30)})`;
      g.beginPath();
      g.ellipse((x - rx * 0.3) * W, (y - ry * 0.2) * H, rx * 0.3 * W, ry * 0.3 * H, 0, 0, 7);
      g.fill();
    }
    // spray where the swell hits the point
    const s = Math.max(0, Math.sin(t * 0.9));
    g.fillStyle = `rgba(255,255,255,${0.5 * s * (1 - 0.5 * L.night)})`;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc((0.27 + hash01(i) * 0.05) * W, (0.77 - s * 0.03 * hash01(i * 3)) * H, W * 0.006 * (1 + hash01(i * 5)), 0, 7);
      g.fill();
    }
  },
};

const lagoon: Painter = {
  horizon: 0.42,
  water: ['#1f7f95', '#2c9aa6', '#74d4c8', '#b4ebd8', '#d8f4e0'],
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    // mangrove islets on the far side of the channel
    for (const [x0, x1, hgt, seed] of [[-0.05, 0.4, 0.05, 1], [0.66, 1.05, 0.042, 2], [0.46, 0.58, 0.02, 3]]) {
      const pts: number[][] = [];
      const n = 9;
      for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, 0.428 - hgt * (0.55 + 0.45 * hash01(seed * 10 + i)) * Math.sin((Math.PI * i) / n) - 0.006]);
      pts.push([x1, 0.436], [x0, 0.436]);
      g.fillStyle = L.haze('#2c6844', 0.2);
      blob(g, W, H, pts);
      g.fill();
      g.strokeStyle = L.shade('#5c4a3a', 0.8);
      g.lineWidth = Math.max(1, H * 0.0018);
      for (let i = 0; i < 14; i++) {
        const x = x0 + (x1 - x0) * (0.05 + 0.9 * hash01(seed * 20 + i));
        g.beginPath();
        g.moveTo(x * W, 0.43 * H);
        g.lineTo((x + (hash01(i) - 0.5) * 0.012) * W, 0.444 * H);
        g.stroke();
      }
    }
    // seagrass and sand ripples on the flat
    patches(p, [[0.22, 0.62, 0.11, 0.014], [0.7, 0.66, 0.13, 0.016], [0.42, 0.74, 0.1, 0.016], [0.16, 0.82, 0.12, 0.018], [0.8, 0.83, 0.09, 0.015]], '#2f7a5a', 0.26);
    g.strokeStyle = L.shade('#ffffff', 0.22);
    g.lineWidth = Math.max(1, H * 0.002);
    for (let i = 0; i < 12; i++) {
      const y = 0.66 + i * 0.025;
      const x = 0.1 + hash01(i * 3) * 0.6;
      g.beginPath();
      g.moveTo(x * W, y * H);
      g.quadraticCurveTo((x + 0.08) * W, (y - 0.006) * H, (x + 0.18) * W, y * H);
      g.stroke();
    }
  },
  front(p) {
    const { g, W, H, L } = p;
    foam(p, 0, 1, 0.935, 0.004);
    g.fillStyle = L.shade('#efe1b8');
    blob(g, W, H, [[-0.1, 0.94], [0.3, 0.925], [0.7, 0.93], [1.1, 0.945], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    // a mangrove shoot in the corner
    g.strokeStyle = L.shade('#5c4a3a');
    g.lineWidth = W * 0.008;
    g.lineCap = 'round';
    for (const dx of [-0.02, 0.01, 0.04]) {
      g.beginPath();
      g.moveTo(0.06 * W, 0.86 * H);
      g.quadraticCurveTo((0.06 + dx) * W, 0.9 * H, (0.06 + dx * 1.8) * W, 0.945 * H);
      g.stroke();
    }
    g.fillStyle = L.shade('#3a7d48');
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse((0.03 + hash01(i * 2) * 0.07) * W, (0.82 + hash01(i * 5) * 0.045) * H, W * 0.026, W * 0.012, i, 0, 7);
      g.fill();
    }
  },
};

const beach: Painter = {
  horizon: 0.3,
  water: ['#1b62a6', '#2a8fbc', '#52c4c0', '#8fe0cf'],
  paint(p) {
    const { g, W, H, L, t } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 0.57, this.water);
    // the reef line, and the wreck on it
    foam(p, 0.45, 1, 0.352, 0.003);
    g.fillStyle = L.haze('#2b2a30', 0.25);
    poly(g, W, H, [[0.72, 0.35], [0.74, 0.332], [0.86, 0.326], [0.9, 0.34], [0.89, 0.352], [0.73, 0.355]]);
    g.fill();
    g.strokeStyle = L.haze('#2b2a30', 0.25);
    g.lineWidth = Math.max(1.5, W * 0.005);
    g.beginPath();
    g.moveTo(0.78 * W, 0.335 * H);
    g.lineTo(0.765 * W, 0.262 * H);
    g.moveTo(0.84 * W, 0.33 * H);
    g.lineTo(0.85 * W, 0.276 * H);
    g.moveTo(0.755 * W, 0.285 * H);
    g.lineTo(0.79 * W, 0.28 * H);
    g.stroke();

    // sand
    const swash = 0.008 * Math.sin(t * 0.7);
    g.fillStyle = L.shade('#cdb684');
    blob(g, W, H, [[-0.1, 0.565 + swash], [0.25, 0.55 + swash], [0.6, 0.535 + swash], [1.1, 0.515 + swash], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    g.fillStyle = L.shade('#efdcae');
    blob(g, W, H, [[-0.1, 0.63], [0.3, 0.61], [0.65, 0.59], [1.1, 0.565], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    g.strokeStyle = `rgba(255,255,255,${0.8 - 0.4 * L.night})`;
    g.lineWidth = Math.max(2, H * 0.005);
    g.beginPath();
    for (let i = 0; i <= 30; i++) {
      const x = -0.05 + (1.1 * i) / 30;
      const y = 0.566 - x * 0.05 + swash + Math.sin(i * 0.8 + t) * 0.003;
      if (i) g.lineTo(x * W, y * H);
      else g.moveTo(x * W, y * H);
    }
    g.stroke();
    // wrack line
    g.strokeStyle = L.shade('#6b5a3c', 0.75);
    g.lineWidth = Math.max(2, H * 0.004);
    g.setLineDash([W * 0.03, W * 0.018, W * 0.012, W * 0.02]);
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const x = -0.02 + (1.04 * i) / 20;
      const y = 0.668 - x * 0.03 + Math.sin(i * 1.7) * 0.004;
      if (i) g.lineTo(x * W, y * H);
      else g.moveTo(x * W, y * H);
    }
    g.stroke();
    g.setLineDash([]);
    // dune shading and grass
    patches(p, [[0.5, 0.93, 0.5, 0.05], [0.15, 0.8, 0.2, 0.018], [0.8, 0.86, 0.22, 0.02]], '#d9c391', 0.5);
    g.strokeStyle = L.shade('#7d9a4f');
    g.lineWidth = Math.max(1.5, W * 0.004);
    for (let i = 0; i < 26; i++) {
      const x = hash01(i * 3.3) < 0.5 ? hash01(i) * 0.24 : 0.78 + hash01(i) * 0.22;
      const y = 0.9 + hash01(i * 7) * 0.09;
      const sway = Math.sin(t * 1.2 + i) * 0.006;
      g.beginPath();
      g.moveTo(x * W, y * H);
      g.quadraticCurveTo((x + sway) * W, (y - 0.02) * H, (x + sway * 2 + (hash01(i * 9) - 0.5) * 0.02) * W, (y - 0.04) * H);
      g.stroke();
    }
    // driftwood, shells and the gull rock
    g.strokeStyle = L.shade('#b7a58a');
    g.lineWidth = W * 0.022;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0.1 * W, 0.755 * H);
    g.lineTo(0.27 * W, 0.735 * H);
    g.stroke();
    g.lineWidth = W * 0.01;
    g.beginPath();
    g.moveTo(0.2 * W, 0.742 * H);
    g.lineTo(0.24 * W, 0.71 * H);
    g.stroke();
    g.fillStyle = L.shade('#fff3e0');
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.ellipse((0.66 + hash01(i * 2) * 0.16) * W, (0.605 + hash01(i * 5) * 0.035) * H, W * 0.009, W * 0.006, i, 0, 7);
      g.fill();
    }
    rock(p, [[0.79, 0.775], [0.83, 0.745], [0.9, 0.75], [0.92, 0.785], [0.8, 0.79]], '#6b6660', '#8d8780');
    palm(p, 0.04, 0.8, 0.44, 0.17, 3, 1.15);
  },
};

const grove: Painter = {
  horizon: 0,
  water: [],
  paint(p) {
    const { g, W, H, L, t } = p;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, L.shade('#cfeab4'));
    grad.addColorStop(0.35, L.shade('#7fb56a'));
    grad.addColorStop(0.7, L.shade('#3f7d4b'));
    grad.addColorStop(1, L.shade('#24503a'));
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    // a strip of sea through the trunks
    g.fillStyle = L.shade('#58c4c4');
    g.fillRect(0, 0.3 * H, W * 0.46, 0.035 * H);
    g.fillStyle = L.shade('#efdcae');
    g.fillRect(0, 0.335 * H, W * 0.5, 0.02 * H);
    // far trunks
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = 0.05 + i * 0.115 + hash01(i) * 0.04;
      g.strokeStyle = L.haze('#4c5d40', 0.3);
      g.lineWidth = W * 0.014;
      g.beginPath();
      g.moveTo(x * W, 0.62 * H);
      g.quadraticCurveTo((x + 0.02) * W, 0.4 * H, (x + (hash01(i * 3) - 0.5) * 0.08) * W, 0.1 * H);
      g.stroke();
    }
    // light shafts
    for (let i = 0; i < 4; i++) {
      const x = 0.15 + i * 0.22;
      g.fillStyle = `rgba(255,255,220,${(0.07 + 0.03 * Math.sin(t * 0.5 + i)) * (1 - L.night)})`;
      poly(g, W, H, [[x, 0], [x + 0.08, 0], [x - 0.06, 0.8], [x - 0.2, 0.8]]);
      g.fill();
    }
    // ground
    g.fillStyle = L.shade('#567a40');
    blob(g, W, H, [[-0.1, 0.66], [0.3, 0.62], [0.7, 0.64], [1.1, 0.6], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    g.fillStyle = L.shade('#3f6534');
    blob(g, W, H, [[-0.1, 0.84], [0.4, 0.8], [0.8, 0.86], [1.1, 0.82], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    // bamboo stand
    for (let i = 0; i < 8; i++) {
      const x = 0.72 + i * 0.03 + hash01(i * 4) * 0.012;
      const top = 0.3 + hash01(i * 6) * 0.14;
      const sway = Math.sin(t * 0.7 + i) * 0.006;
      g.strokeStyle = L.shade(i % 2 ? '#86b24c' : '#6f9c3e');
      g.lineWidth = W * 0.014;
      g.beginPath();
      g.moveTo(x * W, 0.84 * H);
      g.quadraticCurveTo(x * W, 0.6 * H, (x + sway) * W, top * H);
      g.stroke();
      g.strokeStyle = L.shade('#4f7a2e');
      g.lineWidth = Math.max(1, W * 0.003);
      for (let k = 1; k < 7; k++) {
        const y = 0.84 - k * ((0.84 - top) / 7);
        g.beginPath();
        g.moveTo((x - 0.008) * W, y * H);
        g.lineTo((x + 0.008) * W, y * H);
        g.stroke();
      }
      g.fillStyle = L.shade('#5f9a3c');
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.ellipse((x + sway + (k - 1) * 0.02) * W, (top + 0.02 + k * 0.03) * H, W * 0.03, W * 0.007, 0.5 + k, 0, 7);
        g.fill();
      }
    }
    // vines
    g.strokeStyle = L.shade('#2f6a36');
    g.lineWidth = W * 0.007;
    for (let i = 0; i < 5; i++) {
      const x = 0.36 + i * 0.045;
      const len = 0.3 + hash01(i * 8) * 0.16;
      const sway = Math.sin(t * 0.9 + i * 1.3) * 0.012;
      g.beginPath();
      g.moveTo(x * W, 0);
      g.bezierCurveTo((x + 0.02) * W, len * 0.4 * H, (x - 0.02 + sway) * W, len * 0.7 * H, (x + sway * 2) * W, len * H);
      g.stroke();
      g.fillStyle = L.shade('#4c9048');
      for (let k = 2; k < 7; k++) {
        g.beginPath();
        g.ellipse((x + sway * (k / 3) + (k % 2 ? 0.014 : -0.014)) * W, ((len * k) / 7) * H, W * 0.016, W * 0.008, k, 0, 7);
        g.fill();
      }
    }
    palm(p, 0.6, 0.66, 0.5, 0.1, 5, 1.2);
    palm(p, 0.16, 0.7, 0.56, -0.06, 9, 1.3);
    // coconuts and fallen fronds
    g.fillStyle = L.shade('#6b4a2c');
    for (const [x, y] of [[0.62, 0.635], [0.67, 0.645], [0.7, 0.628]]) {
      g.beginPath();
      g.arc(x * W, y * H, W * 0.022, 0, 7);
      g.fill();
    }
    g.fillStyle = L.shade('#8ea24c');
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse((0.16 + i * 0.05) * W, (0.74 + (i % 2) * 0.012) * H, W * 0.085, W * 0.014, -0.3 + i * 0.25, 0, 7);
      g.fill();
    }
    // ferns in the foreground
    g.fillStyle = L.shade('#2a5a34');
    for (let i = 0; i < 14; i++) {
      const x = hash01(i * 2.7);
      const sway = Math.sin(t + i) * 0.01;
      g.beginPath();
      g.ellipse((x + sway) * W, (0.97 + hash01(i * 4) * 0.03) * H, W * 0.07, W * 0.016, -1.2 + hash01(i * 6) * 2.4, 0, 7);
      g.fill();
    }
    // canopy
    for (let i = 0; i < 12; i++) {
      const x = i / 11;
      g.fillStyle = L.shade(i % 2 ? '#2f6a36' : '#255a30');
      g.beginPath();
      g.ellipse(x * W, (-0.01 + hash01(i * 3) * 0.03) * H, W * 0.17, W * 0.045, (hash01(i) - 0.5) * 0.8 + Math.sin(t * 0.6 + i) * 0.03, 0, 7);
      g.fill();
    }
  },
};

const camp: Painter = {
  horizon: 0.34,
  water: ['#1b62a6', '#3aa5bd', '#74d6c8'],
  paint(p) {
    const { g, W, H, L, t, info } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 0.47, this.water);
    foam(p, 0.3, 1, 0.468, 0.003);
    g.fillStyle = L.shade('#ecd9a8');
    blob(g, W, H, [[-0.1, 0.5], [0.3, 0.47], [0.7, 0.475], [1.1, 0.46], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    patches(p, [[0.5, 0.95, 0.6, 0.06], [0.3, 0.7, 0.2, 0.02]], '#d9c391', 0.5);
    // bush behind the shelter
    g.fillStyle = L.shade('#2f6a3c');
    blob(g, W, H, [[-0.1, 0.5], [-0.05, 0.36], [0.1, 0.3], [0.26, 0.33], [0.4, 0.4], [0.5, 0.49], [0.3, 0.52], [-0.1, 0.54]]);
    g.fill();
    g.fillStyle = L.shade('#3f7d48');
    blob(g, W, H, [[0.0, 0.46], [0.08, 0.36], [0.2, 0.35], [0.3, 0.42], [0.38, 0.5], [0.0, 0.52]]);
    g.fill();
    palm(p, 0.93, 0.56, 0.42, -0.1, 11, 1.1);

    // lean-to
    g.fillStyle = L.shade('#2b2a22');
    poly(g, W, H, [[0.09, 0.62], [0.25, 0.43], [0.42, 0.62]]);
    g.fill();
    g.fillStyle = L.shade('#8a9a4c');
    poly(g, W, H, [[0.25, 0.43], [0.45, 0.635], [0.36, 0.64], [0.22, 0.47]]);
    g.fill();
    g.strokeStyle = L.shade('#6b7a38');
    g.lineWidth = Math.max(1, W * 0.004);
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.moveTo((0.25 + i * 0.012) * W, (0.445 + i * 0.012) * H);
      g.lineTo((0.31 + i * 0.02) * W, (0.52 + i * 0.018) * H);
      g.stroke();
    }
    g.strokeStyle = L.shade('#6b5138');
    g.lineWidth = W * 0.012;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0.08 * W, 0.63 * H);
    g.lineTo(0.255 * W, 0.42 * H);
    g.lineTo(0.44 * W, 0.64 * H);
    g.stroke();

    // workbench: a log and a flat stone
    g.fillStyle = L.shade('#7a5c3c');
    g.beginPath();
    g.ellipse(0.26 * W, 0.685 * H, W * 0.1, H * 0.017, -0.05, 0, 7);
    g.fill();
    g.fillStyle = L.shade('#9a7a54');
    g.beginPath();
    g.ellipse(0.165 * W, 0.683 * H, W * 0.018, H * 0.016, 0, 0, 7);
    g.fill();
    rock(p, [[0.28, 0.672], [0.31, 0.662], [0.35, 0.665], [0.36, 0.678], [0.29, 0.682]], '#6b6660', '#8d8780');

    // fire ring
    const fx = 0.54;
    const fy = 0.765;
    g.fillStyle = L.shade('#4a4038', 0.5);
    g.beginPath();
    g.ellipse(fx * W, fy * H, W * 0.075, H * 0.016, 0, 0, 7);
    g.fill();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.fillStyle = L.shade(i % 2 ? '#77716a' : '#5f5a55');
      g.beginPath();
      g.ellipse((fx + Math.cos(a) * 0.075) * W, (fy + Math.sin(a) * 0.016) * H, W * 0.02, H * 0.008, 0, 0, 7);
      g.fill();
    }
    if (info.has('campfire')) {
      g.strokeStyle = L.shade('#5a4026');
      g.lineWidth = W * 0.014;
      g.beginPath();
      g.moveTo((fx - 0.04) * W, (fy + 0.004) * H);
      g.lineTo((fx + 0.035) * W, (fy - 0.008) * H);
      g.moveTo((fx + 0.04) * W, (fy + 0.004) * H);
      g.lineTo((fx - 0.03) * W, (fy - 0.008) * H);
      g.stroke();
      flame(p, fx, fy - 0.004, 0.03);
      // smoke
      for (let i = 0; i < 5; i++) {
        const k = ((t * 0.12 + i / 5) % 1 + 1) % 1;
        g.fillStyle = `rgba(230,230,230,${0.22 * (1 - k)})`;
        g.beginPath();
        g.arc((fx + Math.sin(k * 5 + i) * 0.02 + k * 0.04) * W, (fy - 0.05 - k * 0.22) * H, W * (0.015 + k * 0.04), 0, 7);
        g.fill();
      }
    }
    if (info.has('drying-rack')) {
      const rx = 0.66;
      g.strokeStyle = L.shade('#8a9a4c');
      g.lineWidth = W * 0.009;
      for (const x of [rx, rx + 0.2]) {
        g.beginPath();
        g.moveTo((x - 0.022) * W, 0.775 * H);
        g.lineTo(x * W, 0.665 * H);
        g.lineTo((x + 0.022) * W, 0.775 * H);
        g.stroke();
      }
      g.beginPath();
      g.moveTo((rx - 0.01) * W, 0.672 * H);
      g.lineTo((rx + 0.21) * W, 0.672 * H);
      g.stroke();
      for (let i = 0; i < info.rackCount; i++) {
        g.fillStyle = L.shade('#b9805a');
        g.beginPath();
        g.ellipse((rx + 0.04 + i * 0.06) * W, 0.7 * H, W * 0.012, H * 0.024, 0, 0, 7);
        g.fill();
      }
    }
    // catch basket
    g.fillStyle = L.shade('#a8884e');
    poly(g, W, H, [[0.13, 0.815], [0.23, 0.815], [0.215, 0.86], [0.145, 0.86]]);
    g.fill();
    g.strokeStyle = L.shade('#7a6236');
    g.lineWidth = Math.max(1, W * 0.004);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(0.135 * W, (0.822 + i * 0.01) * H);
      g.lineTo(0.225 * W, (0.822 + i * 0.01) * H);
      g.stroke();
    }

    // the raft, growing part by part at the water's edge
    const hull = info.has('raft-hull');
    g.lineCap = 'round';
    g.strokeStyle = L.shade(hull ? '#a38a62' : '#c9b78f', hull ? 1 : 0.55);
    g.lineWidth = W * 0.02;
    for (let i = 0; i < (hull ? 5 : 2); i++) {
      g.beginPath();
      g.moveTo(0.62 * W, (0.565 + i * 0.013) * H);
      g.lineTo(0.92 * W, (0.548 + i * 0.013) * H);
      g.stroke();
    }
    if (info.has('raft-lashings')) {
      g.strokeStyle = L.shade('#4a3a28');
      g.lineWidth = W * 0.006;
      for (const x of [0.67, 0.77, 0.87]) {
        g.beginPath();
        g.moveTo(x * W, 0.556 * H);
        g.lineTo((x + 0.008) * W, 0.622 * H);
        g.stroke();
      }
    }
    if (info.has('raft-mast')) {
      g.strokeStyle = L.shade('#86b24c');
      g.lineWidth = W * 0.012;
      g.beginPath();
      g.moveTo(0.775 * W, 0.58 * H);
      g.lineTo(0.775 * W, 0.37 * H);
      g.stroke();
    }
    if (info.has('raft-sail')) {
      const puff = Math.sin(t * 1.1) * 0.008;
      g.fillStyle = L.shade('#d9cfa0');
      g.beginPath();
      g.moveTo(0.782 * W, 0.385 * H);
      g.quadraticCurveTo((0.9 + puff) * W, 0.45 * H, 0.885 * W, 0.535 * H);
      g.lineTo(0.782 * W, 0.535 * H);
      g.fill();
      g.strokeStyle = L.shade('#a89a68');
      g.lineWidth = Math.max(1, W * 0.003);
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(0.782 * W, (0.385 + i * 0.03) * H);
        g.lineTo((0.8 + i * 0.02) * W, (0.385 + i * 0.03) * H);
        g.stroke();
      }
    }
    if (info.has('raft-oar')) {
      g.strokeStyle = L.shade('#7a5c3c');
      g.lineWidth = W * 0.008;
      g.beginPath();
      g.moveTo(0.6 * W, 0.6 * H);
      g.lineTo(0.7 * W, 0.535 * H);
      g.stroke();
      g.fillStyle = L.shade('#7a5c3c');
      g.beginPath();
      g.ellipse(0.593 * W, 0.606 * H, W * 0.022, H * 0.007, -0.6, 0, 7);
      g.fill();
    }
    if (info.has('campfire')) glow(g, fx * W, (fy - 0.02) * H, W * (0.5 + 0.03 * Math.sin(t * 9)), 0.25 + 0.75 * L.night);
  },
};

export const PAINTERS: Record<string, Painter> = { 'rocky-point': rockyPoint, lagoon, beach, grove, camp };

export const toolkit = { sky, sea, palm, rock, foam, patches, hills, flame, glow, poly, blob };

/** Registers painters for regions added later (keeps the island file readable). */
export function registerPainters(more: Record<string, Painter>): void {
  Object.assign(PAINTERS, more);
}

export { rgb };
