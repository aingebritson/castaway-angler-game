/** Placeholder scenes for the Cayes: the port town and its four fishing spots. */
import { hash01 } from './light';
import { type P, type Painter, registerPainters, toolkit } from './painters';

const { sky, sea, palm, foam, patches, hills, poly, blob } = toolkit;

/** The bow of the skiff, in the foreground of every spot reached by boat. */
function skiffBow(p: P): void {
  const { g, W, H, L } = p;
  const bobY = Math.sin(p.t * 1.1) * 0.004;
  g.fillStyle = L.shade('#f4f0e2');
  poly(g, W, H, [[0.14, 1.02], [0.2, 0.955 + bobY], [0.5, 0.905 + bobY], [0.8, 0.955 + bobY], [0.86, 1.02]]);
  g.fill();
  g.fillStyle = L.shade('#3fa7a0');
  poly(g, W, H, [[0.2, 0.955 + bobY], [0.5, 0.905 + bobY], [0.8, 0.955 + bobY], [0.79, 0.968 + bobY], [0.5, 0.921 + bobY], [0.21, 0.968 + bobY]]);
  g.fill();
  g.fillStyle = L.shade('#d9d3c0');
  poly(g, W, H, [[0.3, 1.02], [0.34, 0.975 + bobY], [0.66, 0.975 + bobY], [0.7, 1.02]]);
  g.fill();
}

function house(p: P, x: number, y: number, w: number, h: number, wall: string, roof: string): void {
  const { g, W, H, L } = p;
  g.strokeStyle = L.shade('#6b5138');
  g.lineWidth = Math.max(1.5, W * 0.006);
  for (const dx of [0.12, 0.88]) {
    g.beginPath();
    g.moveTo((x + w * dx) * W, (y + h) * H);
    g.lineTo((x + w * dx) * W, (y + h + 0.03) * H);
    g.stroke();
  }
  g.fillStyle = L.shade(wall);
  g.fillRect(x * W, y * H, w * W, h * H);
  g.fillStyle = L.shade(roof);
  poly(g, W, H, [[x - 0.012, y], [x + w / 2, y - h * 0.5], [x + w + 0.012, y]]);
  g.fill();
  g.fillStyle = L.shade('#3a4a52');
  g.fillRect((x + w * 0.18) * W, (y + h * 0.3) * H, w * 0.22 * W, h * 0.34 * H);
  g.fillRect((x + w * 0.6) * W, (y + h * 0.3) * H, w * 0.22 * W, h * 0.7 * H);
  if (L.night > 0.3) {
    g.fillStyle = `rgba(255,214,130,${0.85 * L.night})`;
    g.fillRect((x + w * 0.18) * W, (y + h * 0.3) * H, w * 0.22 * W, h * 0.34 * H);
  }
}

const port: Painter = {
  horizon: 0.36,
  water: ['#1d6aa6', '#2f95b8', '#5cc3bf'],
  paint(p) {
    const { g, W, H, L, t } = p;
    sky(p, this.horizon);
    hills(p, [[0.5, 0.365], [0.62, 0.345], [0.8, 0.34], [1.05, 0.35], [1.05, 0.37]], '#3d6b4c', 0.55);
    sea(p, this.horizon, 0.52, this.water);
    // moored boats
    for (const [x, y, s] of [[0.36, 0.43, 1], [0.6, 0.41, 0.8], [0.52, 0.47, 1.2]]) {
      const bob = Math.sin(t * 1.2 + x * 20) * 0.003;
      g.fillStyle = L.shade(x > 0.55 ? '#d8523f' : '#f1ead8');
      poly(g, W, H, [[x - 0.05 * s, y + bob], [x + 0.05 * s, y + bob], [x + 0.04 * s, y + 0.016 * s + bob], [x - 0.04 * s, y + 0.016 * s + bob]]);
      g.fill();
      g.strokeStyle = L.shade('#5a4a3a');
      g.lineWidth = Math.max(1, W * 0.004);
      g.beginPath();
      g.moveTo(x * W, (y + bob) * H);
      g.lineTo(x * W, (y - 0.05 * s + bob) * H);
      g.stroke();
    }
    // quay
    g.fillStyle = L.shade('#cdbd98');
    blob(g, W, H, [[-0.1, 0.53], [0.3, 0.505], [0.7, 0.51], [1.1, 0.5], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    g.fillStyle = L.shade('#e3d4ae');
    blob(g, W, H, [[-0.1, 0.62], [0.4, 0.6], [0.8, 0.61], [1.1, 0.6], [1.1, 1.1], [-0.1, 1.1]]);
    g.fill();
    foam(p, 0, 1, 0.513, 0.003);
    house(p, 0.02, 0.4, 0.2, 0.1, '#f2b6a0', '#b5553f');
    house(p, 0.6, 0.39, 0.22, 0.11, '#a8d8d0', '#3f7d78');
    house(p, 0.84, 0.41, 0.2, 0.09, '#f3d98a', '#b98a2e');
    house(p, 0.26, 0.42, 0.13, 0.075, '#b9c8f0', '#5a6aa8');
    // market stall with a striped awning
    for (let i = 0; i < 6; i++) {
      g.fillStyle = L.shade(i % 2 ? '#f4f0e2' : '#d8523f');
      poly(g, W, H, [[0.1 + i * 0.05, 0.575], [0.15 + i * 0.05, 0.575], [0.16 + i * 0.05, 0.61], [0.09 + i * 0.05, 0.61]]);
      g.fill();
    }
    g.fillStyle = L.shade('#8a6c4a');
    g.fillRect(0.11 * W, 0.65 * H, 0.28 * W, 0.03 * H);
    g.strokeStyle = L.shade('#6b5138');
    g.lineWidth = W * 0.008;
    for (const x of [0.11, 0.39]) {
      g.beginPath();
      g.moveTo(x * W, 0.6 * H);
      g.lineTo(x * W, 0.7 * H);
      g.stroke();
    }
    // orders board
    g.beginPath();
    g.moveTo(0.46 * W, 0.56 * H);
    g.lineTo(0.46 * W, 0.66 * H);
    g.stroke();
    g.fillStyle = L.shade('#7a5c3c');
    g.fillRect(0.41 * W, 0.535 * H, 0.1 * W, 0.05 * H);
    g.fillStyle = L.shade('#f4f0e2');
    for (let i = 0; i < 3; i++) g.fillRect((0.418 + i * 0.03) * W, (0.542 + (i % 2) * 0.006) * H, 0.022 * W, 0.028 * H);
    // boatyard: a skiff on trestles
    g.fillStyle = L.shade('#f4f0e2');
    poly(g, W, H, [[0.64, 0.82], [0.96, 0.8], [0.93, 0.845], [0.68, 0.855]]);
    g.fill();
    g.fillStyle = L.shade('#3fa7a0');
    poly(g, W, H, [[0.64, 0.82], [0.96, 0.8], [0.955, 0.812], [0.645, 0.832]]);
    g.fill();
    g.strokeStyle = L.shade('#6b5138');
    for (const x of [0.7, 0.9]) {
      g.beginPath();
      g.moveTo((x - 0.02) * W, 0.89 * H);
      g.lineTo(x * W, 0.85 * H);
      g.lineTo((x + 0.02) * W, 0.89 * H);
      g.stroke();
    }
    // a bench for the old salt
    g.fillStyle = L.shade('#7a5c3c');
    g.fillRect(0.1 * W, 0.855 * H, 0.2 * W, 0.012 * H);
    g.fillRect(0.12 * W, 0.867 * H, 0.012 * W, 0.03 * H);
    g.fillRect(0.268 * W, 0.867 * H, 0.012 * W, 0.03 * H);
    palm(p, 0.52, 0.72, 0.34, 0.05, 21, 0.95);
    palm(p, 0.97, 0.7, 0.4, -0.08, 23, 1.05);
  },
};

const pier: Painter = {
  horizon: 0.42,
  water: ['#1a5f8f', '#2a8aa5', '#4bb3a9', '#7fd0b8'],
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    // the town along the far shore
    g.fillStyle = L.haze('#3d6b4c', 0.5);
    g.fillRect(0, 0.405 * H, W, 0.02 * H);
    for (let i = 0; i < 12; i++) {
      const x = 0.02 + i * 0.085;
      const h = 0.012 + hash01(i * 3) * 0.014;
      g.fillStyle = L.haze(['#f2b6a0', '#a8d8d0', '#f3d98a', '#b9c8f0'][i % 4], 0.35);
      g.fillRect(x * W, (0.42 - h) * H, 0.05 * W, h * H);
      if (L.night > 0.3 && i % 2) {
        g.fillStyle = `rgba(255,214,130,${L.night})`;
        g.fillRect((x + 0.015) * W, (0.42 - h * 0.6) * H, 0.008 * W, 0.004 * H);
      }
    }
    sea(p, this.horizon, 1, this.water);
    patches(p, [[0.6, 0.7, 0.16, 0.02], [0.4, 0.82, 0.14, 0.02]], '#d8f0d0', 0.14);
    patches(p, [[0.3, 0.58, 0.1, 0.012], [0.72, 0.6, 0.12, 0.013]], '#0f3f52', 0.24);
  },
  front(p) {
    const { g, W, H, L, t } = p;
    // pilings and cross-braces running out from the left
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const x = 0.05 + i * 0.085;
      const top = 0.66 + i * 0.02;
      g.strokeStyle = L.shade('#4a3b2c');
      g.lineWidth = W * (0.03 - i * 0.003);
      g.beginPath();
      g.moveTo(x * W, top * H);
      g.lineTo(x * W, (top + 0.2) * H);
      g.stroke();
      g.strokeStyle = `rgba(255,255,255,${0.55 - 0.3 * L.night})`;
      g.lineWidth = Math.max(1.5, H * 0.003);
      g.beginPath();
      g.ellipse(x * W, (top + 0.2) * H, W * 0.03, H * 0.005 * (1 + 0.3 * Math.sin(t * 2 + i)), 0, 0, 7);
      g.stroke();
    }
    g.fillStyle = L.shade('#7a6248');
    poly(g, W, H, [[-0.02, 0.63], [0.36, 0.71], [0.36, 0.735], [-0.02, 0.665]]);
    g.fill();
    // the deck underfoot
    g.fillStyle = L.shade('#8a7052');
    poly(g, W, H, [[-0.02, 0.9], [1.02, 0.9], [1.02, 1.02], [-0.02, 1.02]]);
    g.fill();
    g.strokeStyle = L.shade('#5f4a34');
    g.lineWidth = Math.max(1, W * 0.004);
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo((0.06 + i * 0.11) * W, 0.9 * H);
      g.lineTo((0.04 + i * 0.115) * W, 1.02 * H);
      g.stroke();
    }
    g.fillStyle = L.shade('#6b563c');
    g.fillRect(-0.02 * W, 0.895 * H, 1.04 * W, 0.012 * H);
    // the lamp at the end of the pier
    g.strokeStyle = L.shade('#3a3a3a');
    g.lineWidth = W * 0.012;
    g.beginPath();
    g.moveTo(0.07 * W, 0.66 * H);
    g.lineTo(0.07 * W, 0.5 * H);
    g.stroke();
    g.fillStyle = L.night > 0.3 ? '#ffe6a0' : L.shade('#e8e2cc');
    g.beginPath();
    g.arc(0.07 * W, 0.495 * H, W * 0.022, 0, 7);
    g.fill();
    if (L.night > 0.3) toolkit.glow(g, 0.07 * W, 0.5 * H, W * 0.5, L.night * 0.9, '255,220,140');
  },
};

const mangrove: Painter = {
  horizon: 0.42,
  water: ['#2f5f4f', '#3f7a5f', '#6a9f7a', '#9cc39a'],
  paint(p) {
    const { g, W, H, L, t } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    // the creek bend: deeper, darker water
    patches(p, [[0.5, 0.55, 0.42, 0.045]], '#1f3f38', 0.4);
    // a wall of mangrove
    for (let layer = 0; layer < 2; layer++) {
      const base = 0.445 + layer * 0.012;
      const pts: number[][] = [[-0.05, base]];
      for (let i = 0; i <= 14; i++) pts.push([i / 14, base - 0.2 + layer * 0.06 - 0.07 * hash01(i * 3 + layer * 9) + Math.sin(t * 0.5 + i) * 0.003]);
      pts.push([1.05, base]);
      g.fillStyle = L.shade(layer ? '#356f45' : '#27573a');
      blob(g, W, H, pts);
      g.fill();
    }
    g.strokeStyle = L.shade('#5a4636');
    g.lineWidth = Math.max(1.5, W * 0.005);
    g.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const x = hash01(i * 2.3);
      const spread = (hash01(i * 5.1) - 0.5) * 0.05;
      g.beginPath();
      g.moveTo(x * W, 0.43 * H);
      g.quadraticCurveTo((x + spread * 0.3) * W, 0.455 * H, (x + spread) * W, (0.475 + hash01(i) * 0.012) * H);
      g.stroke();
    }
    // reflections and floating leaves
    patches(p, [[0.2, 0.5, 0.2, 0.012], [0.75, 0.505, 0.22, 0.012]], '#1f3f2e', 0.35);
    g.fillStyle = L.shade('#c9b04a', 0.8);
    for (let i = 0; i < 8; i++) {
      const x = (hash01(i * 7) + t * 0.004 * (1 + hash01(i))) % 1;
      g.beginPath();
      g.ellipse(x * W, (0.6 + hash01(i * 3) * 0.3) * H, W * 0.012, W * 0.005, i, 0, 7);
      g.fill();
    }
  },
  front(p) {
    skiffBow(p);
  },
};

const reef: Painter = {
  horizon: 0.42,
  water: ['#0f4f9a', '#1c7fb8', '#2fb0c0', '#6fdcc8', '#9aead0'],
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    // breakers on the barrier reef, far out
    foam(p, 0.05, 0.95, 0.436, 0.002);
    // coral heads: gold and brown under the surface
    for (let i = 0; i < 14; i++) {
      const y = 0.56 + hash01(i * 3) * 0.34;
      const k = (y - 0.42) / 0.58;
      g.fillStyle = L.shade(i % 3 ? '#8a6a3a' : '#b98a4a', 0.34);
      g.beginPath();
      g.ellipse(hash01(i * 7) * W, y * H, W * (0.05 + 0.1 * k) * (0.6 + hash01(i)), H * (0.008 + 0.02 * k), 0, 0, 7);
      g.fill();
    }
    patches(p, [[0.5, 0.515, 0.5, 0.02]], '#0b3566', 0.35);
    patches(p, [[0.3, 0.86, 0.16, 0.02], [0.72, 0.8, 0.14, 0.018]], '#e8f6e0', 0.2);
  },
  front(p) {
    skiffBow(p);
  },
};

const cut: Painter = {
  horizon: 0.42,
  water: ['#0b3a78', '#17629f', '#3aa5b8', '#8fdcc8', '#c9f0dc'],
  paint(p) {
    const { g, W, H, L } = p;
    sky(p, this.horizon);
    sea(p, this.horizon, 1, this.water);
    // the mouth of the channel, ink blue between two cayes
    patches(p, [[0.5, 0.455, 0.2, 0.03]], '#07264f', 0.55);
    for (const side of [0, 1]) {
      const sx = (x: number) => (side ? 1 - x : x);
      g.fillStyle = L.shade('#efe1b8');
      blob(g, W, H, [[sx(-0.1), 0.44], [sx(0.2), 0.425], [sx(0.36), 0.432], [sx(0.4), 0.445], [sx(-0.1), 0.46]]);
      g.fill();
      g.fillStyle = L.haze('#2f6a3c', 0.15);
      blob(g, W, H, [[sx(-0.1), 0.432], [sx(0.02), 0.385], [sx(0.16), 0.38], [sx(0.3), 0.405], [sx(0.34), 0.43], [sx(-0.1), 0.44]]);
      g.fill();
      palm(p, sx(0.12), 0.41, 0.09, side ? -0.02 : 0.02, 31 + side, 0.32);
      palm(p, sx(0.24), 0.415, 0.07, side ? 0.015 : -0.015, 37 + side, 0.26);
      // sand shoulders
      g.fillStyle = L.shade('#f4ecc8', 0.3);
      blob(g, W, H, [[sx(-0.1), 0.6], [sx(0.2), 0.62], [sx(0.3), 0.75], [sx(0.16), 0.95], [sx(-0.1), 1]]);
      g.fill();
    }
    // current lines
    g.strokeStyle = L.shade('#ffffff', 0.18);
    g.lineWidth = Math.max(1, H * 0.002);
    for (let i = 0; i < 9; i++) {
      const y = 0.5 + i * 0.045;
      const off = ((p.t * 0.02 * (1 + i * 0.2)) % 0.3) - 0.15;
      g.beginPath();
      g.moveTo((0.38 + off) * W, y * H);
      g.quadraticCurveTo((0.5 + off) * W, (y + 0.008) * H, (0.62 + off) * W, y * H);
      g.stroke();
    }
  },
  front(p) {
    skiffBow(p);
  },
};

registerPainters({ port, pier, mangrove, reef, cut });
