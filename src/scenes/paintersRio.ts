/**
 * Placeholder scenes for the Rio Negro: the river town and its five fishing
 * spots. Blackwater is the colour of strong tea; the sand is white. River
 * scenes read `info.water`, so beaches show at low water and drown at high.
 */
import { hash01 } from './light';
import { type P, type Painter, registerPainters, toolkit } from './painters';

const { sky, sea, patches, hills, poly, blob, rock } = toolkit;

const BLACKWATER = ['#3b2a1f', '#4a3022', '#583822', '#6a4426'];
const SAND = '#efe6cf';

/** A far bank of forest along the horizon, with a few emergent crowns. */
function forest(p: P, y: number, depth: number, color = '#2f5a35', seed = 1): void {
  const { g, W, H, L } = p;
  const pts: number[][] = [[-0.05, y + 0.01]];
  for (let i = 0; i <= 18; i++) pts.push([i / 18, y - depth * (0.55 + 0.45 * hash01(i * 3.7 + seed))]);
  pts.push([1.05, y + 0.01]);
  g.fillStyle = L.haze(color, 0.25);
  blob(g, W, H, pts);
  g.fill();
  for (let i = 0; i < 6; i++) {
    const x = hash01(i * 9.1 + seed);
    g.beginPath();
    g.ellipse(x * W, (y - depth * 1.05) * H, W * 0.035, H * depth * 0.35, 0, 0, 7);
    g.fill();
  }
}

/** A trunk standing in the water, with its reflection. */
function trunk(p: P, x: number, top: number, base: number, w: number, color = '#5b4a3a'): void {
  const { g, W, H, L, t } = p;
  g.fillStyle = L.shade(color);
  g.fillRect((x - w / 2) * W, top * H, w * W, (base - top) * H);
  g.fillStyle = L.shade(color, 0.35);
  g.fillRect((x - w / 2 + Math.sin(t + x * 9) * 0.002) * W, base * H, w * W, (base - top) * 0.25 * H);
  g.fillStyle = L.shade('#8a7a5a', 0.6);
  g.fillRect((x - w / 2) * W, (base - 0.004) * H, w * W, 0.004 * H);
}

/** A wooden house on stilts, or floating on logs. */
function stiltHouse(p: P, x: number, y: number, w: number, h: number, wall: string, roof: string): void {
  const { g, W, H, L } = p;
  g.strokeStyle = L.shade('#4a3a2c');
  g.lineWidth = Math.max(1.5, W * 0.005);
  for (const dx of [0.1, 0.5, 0.9]) {
    g.beginPath();
    g.moveTo((x + w * dx) * W, (y + h) * H);
    g.lineTo((x + w * dx) * W, (y + h + 0.035) * H);
    g.stroke();
  }
  g.fillStyle = L.shade(wall);
  g.fillRect(x * W, y * H, w * W, h * H);
  g.fillStyle = L.shade(roof);
  poly(g, W, H, [[x - 0.015, y], [x + w / 2, y - h * 0.45], [x + w + 0.015, y]]);
  g.fill();
  g.fillStyle = L.shade('#2c2a2a');
  g.fillRect((x + w * 0.2) * W, (y + h * 0.35) * H, w * 0.2 * W, h * 0.3 * H);
  g.fillRect((x + w * 0.6) * W, (y + h * 0.3) * H, w * 0.2 * W, h * 0.7 * H);
}

/** A long narrow wooden canoe with an outboard, nose to the bank. */
function canoe(p: P, x: number, y: number, len: number, color = '#2f6f8f'): void {
  const { g, W, H, L, t } = p;
  const bob = Math.sin(t * 1.2 + x * 7) * 0.002;
  g.fillStyle = L.shade(color);
  poly(g, W, H, [[x, y + bob], [x + len, y - 0.006 + bob], [x + len * 0.96, y + 0.012 + bob], [x + len * 0.06, y + 0.014 + bob]]);
  g.fill();
  g.fillStyle = L.shade('#e8dcc0');
  g.fillRect((x + len * 0.05) * W, (y - 0.002 + bob) * H, len * 0.9 * W, 0.003 * H);
}

/** The bow of the canoe in the foreground of spots reached by boat. */
function bow(p: P): void {
  const { g, W, H, L } = p;
  const y = Math.sin(p.t * 1.1) * 0.004;
  g.fillStyle = L.shade('#6b4a2e');
  poly(g, W, H, [[0.3, 1.02], [0.44, 0.93 + y], [0.5, 0.905 + y], [0.56, 0.93 + y], [0.7, 1.02]]);
  g.fill();
  g.fillStyle = L.shade('#8a6440');
  poly(g, W, H, [[0.36, 1.02], [0.46, 0.945 + y], [0.54, 0.945 + y], [0.64, 1.02]]);
  g.fill();
}

const port: Painter = {
  horizon: 0.36,
  water: BLACKWATER,
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 0.62, this.water);
    forest(p, this.horizon, 0.03, '#3d6a3f', 2);
    // a river boat moored off the town
    g.fillStyle = L.shade('#f2efe4');
    g.fillRect(0.56 * W, 0.47 * H, 0.3 * W, 0.035 * H);
    g.fillStyle = L.shade('#2f6f8f');
    g.fillRect(0.56 * W, 0.505 * H, 0.3 * W, 0.018 * H);
    g.fillStyle = L.shade('#e2d9c2');
    g.fillRect(0.6 * W, 0.445 * H, 0.2 * W, 0.026 * H);
    canoe(p, 0.12, 0.58, 0.22, '#b8452c');
    // the bank, and the town on it
    g.fillStyle = L.shade('#b98a56');
    poly(g, W, H, [[-0.02, 0.6], [0.4, 0.58], [1.02, 0.61], [1.02, 1.02], [-0.02, 1.02]]);
    g.fill();
    g.fillStyle = L.shade('#7d6a4a');
    poly(g, W, H, [[-0.02, 0.76], [1.02, 0.74], [1.02, 1.02], [-0.02, 1.02]]);
    g.fill();
    stiltHouse(p, 0.04, 0.35, 0.26, 0.09, '#e7c35a', '#a8432f');
    stiltHouse(p, 0.38, 0.36, 0.22, 0.08, '#7fb7a6', '#6b4a3a');
    stiltHouse(p, 0.68, 0.35, 0.27, 0.09, '#e9e2d0', '#3f6f8a');
    stiltHouse(p, 0.12, 0.58, 0.22, 0.08, '#d98a5a', '#5a3a2a');
    stiltHouse(p, 0.66, 0.58, 0.26, 0.08, '#a9c46a', '#8a3a2a');
    patches(p, [[0.5, 0.86, 0.3, 0.02]], '#5a4a34', 0.3);
  },
};

const waterfront: Painter = {
  horizon: 0.32,
  water: BLACKWATER,
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    forest(p, this.horizon, 0.025, '#3d6a3f', 4);
    patches(p, [[0.6, 0.55, 0.3, 0.02], [0.4, 0.75, 0.3, 0.02]], '#a87a4a', 0.12);
    // floating houses on log rafts down the left side
    stiltHouse(p, -0.04, 0.4, 0.22, 0.07, '#e7c35a', '#a8432f');
    stiltHouse(p, 0.2, 0.37, 0.16, 0.05, '#7fb7a6', '#6b4a3a');
    g.fillStyle = L.shade('#6b5338');
    g.fillRect(-0.05 * W, 0.505 * H, 0.46 * W, 0.012 * H);
    canoe(p, 0.55, 0.44, 0.2, '#2f6f8f');
    canoe(p, 0.72, 0.5, 0.18, '#b8452c');
  },
  front(p) {
    const { g, W, H, L } = p;
    // the plank landing underfoot
    g.fillStyle = L.shade('#7a6248');
    poly(g, W, H, [[-0.02, 0.9], [1.02, 0.92], [1.02, 1.02], [-0.02, 1.02]]);
    g.fill();
    g.strokeStyle = L.shade('#5a4632');
    g.lineWidth = Math.max(1, W * 0.004);
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo((0.07 + i * 0.13) * W, 0.9 * H);
      g.lineTo((0.05 + i * 0.13) * W, 1.02 * H);
      g.stroke();
    }
  },
};

const river: Painter = {
  horizon: 0.3,
  water: BLACKWATER,
  paint(p) {
    const { g, W, H, L } = p;
    const low = p.info.water === 'low' || p.info.water === 'falling';
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    forest(p, this.horizon, 0.03, '#2f5a35', 7);
    if (low) {
      // a long white beach on the far side, and a sandbar mid-river
      g.fillStyle = L.shade(SAND);
      blob(g, W, H, [[-0.05, 0.31], [0.4, 0.305], [0.75, 0.315], [1.05, 0.31], [1.05, 0.325], [-0.05, 0.33]]);
      g.fill();
      blob(g, W, H, [[0.55, 0.42], [0.75, 0.41], [0.92, 0.425], [0.75, 0.435]]);
      g.fill();
    } else {
      // the forest standing in the river
      for (let i = 0; i < 9; i++) trunk(p, 0.05 + i * 0.11 + 0.02 * hash01(i), 0.27, 0.315, 0.008);
    }
    patches(p, [[0.5, 0.62, 0.45, 0.04]], '#1c120c', 0.35);
    if (low) {
      g.fillStyle = L.shade(SAND);
      poly(g, W, H, [[-0.02, 0.86], [0.3, 0.83], [0.7, 0.85], [1.02, 0.82], [1.02, 1.02], [-0.02, 1.02]]);
      g.fill();
      g.fillStyle = L.shade('#d9ccae');
      poly(g, W, H, [[-0.02, 0.86], [0.3, 0.83], [0.7, 0.85], [1.02, 0.82], [1.02, 0.835], [0.7, 0.865], [0.3, 0.845], [-0.02, 0.875]]);
      g.fill();
    }
  },
  front(p) {
    if (!(p.info.water === 'low' || p.info.water === 'falling')) bow(p);
  },
};

const lake: Painter = {
  horizon: 0.34,
  water: ['#3a2a20', '#45301f', '#523621', '#634324'],
  paint(p) {
    const { g, W, H, L, t } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    hills(p, [[0, 0.3], [0.3, 0.27], [0.6, 0.29], [1, 0.27]], '#3f6a40', 0.4);
    forest(p, this.horizon, 0.04, '#2c5533', 11);
    // the forest's reflection in still water
    patches(p, [[0.5, 0.36, 0.6, 0.02]], '#1d2a18', 0.45);
    // a dead tree and lily pads near the margin
    trunk(p, 0.82, 0.3, 0.42, 0.01, '#8a8070');
    g.fillStyle = L.shade('#4f8a3f');
    for (let i = 0; i < 14; i++) {
      const x = 0.05 + 0.4 * hash01(i * 3.3);
      const y = 0.7 + 0.22 * hash01(i * 5.9);
      g.beginPath();
      g.ellipse(x * W, (y + Math.sin(t * 0.7 + i) * 0.001) * H, W * 0.03, H * 0.008, 0, 0.3, 6.1);
      g.fill();
    }
  },
  front: bow,
};

const igapo: Painter = {
  horizon: 0.5,
  water: ['#2a1e16', '#33241a', '#3e2b1c', '#4c341f'],
  paint(p) {
    const { g, W, H, L } = p;
    // the canopy closes overhead: green above, trunks into dark water below
    g.fillStyle = L.shade('#1f3a22');
    g.fillRect(0, 0, W, this.horizon * H + 2);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = L.shade(i % 3 ? '#2f5a30' : '#3e6e38', 0.85);
      g.beginPath();
      g.ellipse(hash01(i * 4.1) * W, hash01(i * 2.7) * this.horizon * 0.8 * H, W * (0.06 + 0.06 * hash01(i)), H * 0.03, 0, 0, 7);
      g.fill();
    }
    // light falling through a gap
    const shaft = g.createLinearGradient(0, 0, 0, this.horizon * H);
    shaft.addColorStop(0, `rgba(255,240,190,${0.25 * (1 - p.L.night)})`);
    shaft.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = shaft;
    poly(g, W, H, [[0.55, 0], [0.7, 0], [0.62, this.horizon], [0.48, this.horizon]]);
    g.fill();
    sea(p, this.horizon, 1, this.water);
    for (let i = 0; i < 12; i++) {
      const x = hash01(i * 6.7);
      const near = hash01(i * 1.9);
      trunk(p, x, 0.05 + 0.2 * near, this.horizon + 0.02 + 0.2 * near, 0.012 + 0.03 * near, i % 2 ? '#5b4a3a' : '#6e5a44');
    }
    // floating leaves and fallen fruit
    g.fillStyle = L.shade('#8a7a3a', 0.8);
    for (let i = 0; i < 10; i++) {
      g.beginPath();
      g.ellipse(hash01(i * 11) * W, (0.6 + 0.35 * hash01(i * 13)) * H, W * 0.01, W * 0.004, i, 0, 7);
      g.fill();
    }
  },
  front: bow,
};

const rapids: Painter = {
  horizon: 0.3,
  water: ['#4a3426', '#5a3e28', '#6a4a2c', '#7a5432'],
  paint(p) {
    const { g, W, H, L, t } = p;
    const low = p.info.water === 'low' || p.info.water === 'falling';
    sky(p, this.horizon);
    hills(p, [[0, 0.25], [0.25, 0.2], [0.55, 0.24], [0.8, 0.19], [1, 0.23]], '#3a6a3d', 0.35);
    sea(p, this.horizon, 1, this.water);
    forest(p, this.horizon, 0.03, '#2f5a35', 17);
    // the rapid: a band of broken white water across the river
    for (let i = 0; i < 60; i++) {
      const x = hash01(i * 3.1);
      const y = 0.42 + 0.05 * hash01(i * 7.3);
      g.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3 + i))})`;
      g.fillRect(x * W, y * H, W * (0.02 + 0.03 * hash01(i)), H * 0.003);
    }
    const n = low ? 7 : 4;
    for (let i = 0; i < n; i++) {
      const x = 0.08 + i * (0.9 / n) + 0.05 * hash01(i * 2.2);
      const y = 0.43 + 0.04 * hash01(i * 4.4);
      const w = 0.05 + 0.04 * hash01(i);
      rock(p, [[x - w, y + 0.01], [x - w * 0.6, y - 0.015], [x + w * 0.5, y - 0.02], [x + w, y + 0.01]], '#3a3330', '#5a514a');
    }
    if (low) rock(p, [[0.6, 0.74], [0.68, 0.7], [0.82, 0.69], [0.9, 0.74]], '#3a3330', '#5a514a');
    patches(p, [[0.5, 0.82, 0.3, 0.03]], '#2a1a10', 0.35);
  },
  front: bow,
};

registerPainters({ 'river-port': port, waterfront, river, lake, igapo, rapids });
