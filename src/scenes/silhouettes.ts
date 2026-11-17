/**
 * Placeholder creature art, drawn in code. Each species names a shape class;
 * shapes are true to the animal's outline (body depth, tail, fin position) so
 * players can learn to read silhouettes before specimen art arrives.
 *
 * Everything is drawn in unit space: length 1, facing left, centred on 0,0.
 */

type G = CanvasRenderingContext2D;

interface FishShape {
  /** Body depth over length. */
  h: number;
  tail: 'fork' | 'deepfork' | 'lunate' | 'round' | 'trunc';
  dorsal: 'long' | 'short' | 'sickle' | 'double' | 'far' | 'spiny' | 'sail';
  /** 0 blunt head, 1 pointed. */
  nose: number;
  /** Tail stalk half-thickness. */
  ped: number;
  beak?: number;
  /** Lower jaw juts forward and up (tarpon, barracuda). */
  jaw?: boolean;
  /** Snout overhangs the mouth (bonefish). */
  under?: boolean;
  anal?: 'sickle' | 'far' | 'normal';
  marks?: 'bars' | 'stripe' | 'spots' | 'none';
}

const FISH: Record<string, FishShape> = {
  damsel: { h: 0.5, tail: 'fork', dorsal: 'long', nose: 0.25, ped: 0.06, marks: 'bars' },
  wrasse: { h: 0.23, tail: 'trunc', dorsal: 'long', nose: 0.7, ped: 0.05, marks: 'stripe' },
  grunt: { h: 0.37, tail: 'fork', dorsal: 'long', nose: 0.45, ped: 0.05, marks: 'stripe' },
  mojarra: { h: 0.43, tail: 'deepfork', dorsal: 'spiny', nose: 0.8, ped: 0.045, marks: 'bars' },
  yellowtail: { h: 0.3, tail: 'deepfork', dorsal: 'long', nose: 0.7, ped: 0.04, marks: 'stripe' },
  snapper: { h: 0.38, tail: 'fork', dorsal: 'long', nose: 0.6, ped: 0.055, marks: 'bars' },
  squirrel: { h: 0.36, tail: 'deepfork', dorsal: 'spiny', nose: 0.5, ped: 0.04, marks: 'stripe' },
  jack: { h: 0.33, tail: 'deepfork', dorsal: 'sickle', nose: 0.5, ped: 0.025, anal: 'sickle', marks: 'stripe' },
  needle: { h: 0.065, tail: 'fork', dorsal: 'far', nose: 1, ped: 0.02, beak: 0.2, anal: 'far', marks: 'none' },
  bonefish: { h: 0.2, tail: 'deepfork', dorsal: 'short', nose: 0.85, ped: 0.035, under: true, marks: 'none' },
  permit: { h: 0.6, tail: 'deepfork', dorsal: 'sickle', nose: 0.1, ped: 0.03, anal: 'sickle', marks: 'none' },
  barracuda: { h: 0.13, tail: 'fork', dorsal: 'double', nose: 1, ped: 0.035, jaw: true, anal: 'far', marks: 'spots' },
  tarpon: { h: 0.26, tail: 'deepfork', dorsal: 'short', nose: 0.35, ped: 0.04, jaw: true, anal: 'far', marks: 'none' },
  grouper: { h: 0.4, tail: 'round', dorsal: 'long', nose: 0.35, ped: 0.08, marks: 'spots' },
  mahi: { h: 0.27, tail: 'deepfork', dorsal: 'sail', nose: 0, ped: 0.025, marks: 'spots' },
  tuna: { h: 0.3, tail: 'lunate', dorsal: 'double', nose: 0.8, ped: 0.018, anal: 'far', marks: 'none' },
  snook: { h: 0.22, tail: 'fork', dorsal: 'double', nose: 0.95, ped: 0.045, jaw: true, marks: 'stripe' },
  trigger: { h: 0.52, tail: 'lunate', dorsal: 'sickle', nose: 0.5, ped: 0.05, anal: 'sickle', marks: 'none' },
  parrot: { h: 0.36, tail: 'trunc', dorsal: 'long', nose: 0.15, ped: 0.08, marks: 'none' },
  wahoo: { h: 0.14, tail: 'lunate', dorsal: 'long', nose: 1, ped: 0.02, anal: 'far', marks: 'bars' },
  shark: { h: 0.2, tail: 'lunate', dorsal: 'short', nose: 0.9, ped: 0.03, under: true, marks: 'none' },
  sardine: { h: 0.2, tail: 'deepfork', dorsal: 'short', nose: 0.7, ped: 0.03, marks: 'none' },
};

function fishBody(g: G, s: FishShape): void {
  const top = -s.h / 2;
  const bot = s.h / 2;
  const noseY = s.under ? s.h * 0.08 : s.jaw ? -s.h * 0.02 : 0;
  const k = 1 - 0.4 * s.nose;
  const x0 = -0.5 + (s.beak ?? 0);
  const end = 0.3;
  g.beginPath();
  g.moveTo(x0, noseY);
  g.bezierCurveTo(x0 + 0.03, top * 1.2 * k, -0.05, top * 1.18, end, -s.ped);
  // tail
  const th = Math.max(s.h * 0.52, 0.11);
  switch (s.tail) {
    case 'fork':
      g.lineTo(0.5, -th);
      g.quadraticCurveTo(0.41, 0, 0.5, th);
      break;
    case 'deepfork':
      g.lineTo(0.5, -th * 1.1);
      g.quadraticCurveTo(0.34, 0, 0.5, th * 1.1);
      break;
    case 'lunate':
      g.quadraticCurveTo(0.42, -th * 0.9, 0.5, -th * 1.25);
      g.quadraticCurveTo(0.37, 0, 0.5, th * 1.25);
      g.quadraticCurveTo(0.42, th * 0.9, end, s.ped);
      break;
    case 'round':
      g.quadraticCurveTo(0.4, -th * 0.9, 0.47, -th * 0.55);
      g.quadraticCurveTo(0.52, 0, 0.47, th * 0.55);
      g.quadraticCurveTo(0.4, th * 0.9, end, s.ped);
      break;
    case 'trunc':
      g.lineTo(0.47, -th * 0.75);
      g.lineTo(0.47, th * 0.75);
      break;
  }
  g.lineTo(end, s.ped);
  g.bezierCurveTo(-0.05, bot * 1.18, x0 + 0.03, bot * 1.2 * k, x0, noseY);
  g.closePath();
}

function fishFins(g: G, s: FishShape): void {
  const top = -s.h / 2;
  const bot = s.h / 2;
  g.beginPath();
  switch (s.dorsal) {
    case 'long':
      g.moveTo(-0.24, top * 0.9);
      g.quadraticCurveTo(-0.16, top - 0.1, -0.02, top - 0.07);
      g.lineTo(0.2, top * 0.55 - 0.05);
      g.lineTo(0.24, -s.ped);
      break;
    case 'spiny':
      g.moveTo(-0.24, top * 0.9);
      for (let i = 0; i < 5; i++) {
        g.lineTo(-0.2 + i * 0.07, top - 0.11 + i * 0.012);
        g.lineTo(-0.17 + i * 0.07, top * 0.92 - 0.02);
      }
      g.lineTo(0.22, -s.ped);
      break;
    case 'short':
      g.moveTo(-0.09, top * 0.95);
      g.lineTo(-0.03, top - 0.12);
      g.lineTo(0.07, top * 0.85);
      break;
    case 'sickle':
      g.moveTo(-0.04, top * 0.95);
      g.quadraticCurveTo(0.0, top - 0.2, 0.1, top - 0.3);
      g.quadraticCurveTo(0.06, top - 0.06, 0.14, top * 0.7);
      g.lineTo(0.27, -s.ped);
      break;
    case 'double':
      g.moveTo(-0.14, top * 0.95);
      g.lineTo(-0.1, top - 0.085);
      g.lineTo(-0.04, top * 0.95);
      g.moveTo(0.12, top * 0.8);
      g.lineTo(0.16, top * 0.8 - 0.075);
      g.lineTo(0.22, top * 0.6);
      break;
    case 'far':
      g.moveTo(0.14, top * 0.9);
      g.lineTo(0.2, top - 0.06);
      g.lineTo(0.27, -s.ped);
      break;
    case 'sail':
      g.moveTo(-0.42, top * 0.6);
      g.quadraticCurveTo(-0.3, top - 0.12, -0.1, top - 0.07);
      g.lineTo(0.26, -s.ped);
      break;
  }
  g.closePath();
  g.fill();
  g.beginPath();
  if (s.anal === 'sickle') {
    g.moveTo(-0.02, bot * 0.95);
    g.quadraticCurveTo(0.03, bot + 0.16, 0.12, bot + 0.24);
    g.quadraticCurveTo(0.08, bot + 0.05, 0.15, bot * 0.7);
    g.lineTo(0.27, s.ped);
  } else if (s.anal === 'far') {
    g.moveTo(0.13, bot * 0.9);
    g.lineTo(0.2, bot + 0.055);
    g.lineTo(0.27, s.ped);
  } else {
    g.moveTo(0.04, bot * 0.92);
    g.lineTo(0.12, bot + 0.07);
    g.lineTo(0.22, s.ped + 0.01);
  }
  g.closePath();
  g.fill();
  // pelvic fin
  g.beginPath();
  g.moveTo(-0.16, bot * 0.9);
  g.lineTo(-0.1, bot + 0.06);
  g.lineTo(-0.06, bot * 0.95);
  g.closePath();
  g.fill();
  if (s.beak) {
    g.beginPath();
    g.moveTo(-0.5, 0);
    g.lineTo(-0.5 + s.beak + 0.02, -s.h * 0.22);
    g.lineTo(-0.5 + s.beak + 0.02, s.h * 0.22);
    g.closePath();
    g.fill();
  }
}

function fishMarks(g: G, s: FishShape, accent: string): void {
  g.fillStyle = accent;
  g.strokeStyle = accent;
  if (s.marks === 'bars') {
    g.globalAlpha = 0.75;
    for (let i = 0; i < 5; i++) g.fillRect(-0.3 + i * 0.105, -s.h, 0.04, s.h * 2);
  } else if (s.marks === 'stripe') {
    g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(-0.46, -s.h * 0.02);
    g.quadraticCurveTo(0, -s.h * 0.16, 0.36, -0.01);
    g.lineTo(0.36, 0.02);
    g.quadraticCurveTo(0, -s.h * 0.02, -0.46, s.h * 0.06);
    g.fill();
  } else if (s.marks === 'spots') {
    g.globalAlpha = 0.7;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(-0.28 + i * 0.065, s.h * (0.12 + 0.16 * Math.sin(i * 2.4)), 0.012 + 0.006 * ((i * 7) % 3), 0, 7);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

export interface DrawOpts {
  fill: string;
  accent?: string;
  /** Flat silhouette: no markings, no eye. */
  flat?: boolean;
}

type Special = (g: G, o: DrawOpts) => void;

const dot = (g: G, x: number, y: number, r: number) => {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
};

const SPECIAL: Record<string, Special> = {
  eel(g, o) {
    g.beginPath();
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([-0.5 + t, Math.sin(t * 7.2) * 0.07 * (0.3 + t)]);
    }
    const w = (t: number) => 0.045 * (1 - t * 0.75) + 0.008;
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y - w(i / 24)) : g.moveTo(x, y)));
    for (let i = 24; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1] + w(i / 24));
    g.closePath();
    g.fill();
    if (!o.flat && o.accent) {
      g.fillStyle = o.accent;
      g.globalAlpha = 0.7;
      for (let i = 2; i < 23; i++) dot(g, pts[i][0], pts[i][1] + (i % 2 ? 0.012 : -0.012), 0.011);
      g.globalAlpha = 1;
    }
  },
  lobster(g, o) {
    g.beginPath();
    g.ellipse(-0.12, 0, 0.17, 0.085, 0, 0, 7);
    g.fill();
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.ellipse(0.08 + i * 0.065, 0, 0.045, 0.075 - i * 0.008, 0, 0, 7);
      g.fill();
    }
    g.beginPath();
    g.moveTo(0.36, -0.04);
    g.lineTo(0.5, -0.11);
    g.lineTo(0.5, 0.11);
    g.lineTo(0.36, 0.04);
    g.fill();
    g.lineWidth = 0.016;
    g.strokeStyle = o.fill;
    g.lineCap = 'round';
    for (const sgn of [-1, 1]) {
      g.beginPath();
      g.moveTo(-0.27, sgn * 0.03);
      g.quadraticCurveTo(-0.42, sgn * 0.2, -0.5, sgn * 0.05);
      g.stroke();
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-0.2 + i * 0.07, sgn * 0.07);
        g.lineTo(-0.24 + i * 0.08, sgn * 0.17);
        g.stroke();
      }
    }
    if (!o.flat && o.accent) {
      g.fillStyle = o.accent;
      for (let i = 0; i < 4; i++) dot(g, 0.1 + i * 0.065, -0.03, 0.012);
    }
  },
  crab(g, o) {
    g.beginPath();
    g.ellipse(0, 0, 0.25, 0.17, 0, 0, 7);
    g.fill();
    g.lineWidth = 0.035;
    g.strokeStyle = o.fill;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(sx * 0.2, 0.02 + i * 0.03);
        g.lineTo(sx * (0.36 + i * 0.01), 0.0 + i * 0.07);
        g.lineTo(sx * (0.44 - i * 0.02), 0.12 + i * 0.07);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(sx * 0.18, -0.08);
      g.lineTo(sx * 0.34, -0.2);
      g.stroke();
      g.beginPath();
      g.ellipse(sx * 0.37, -0.23, 0.075, 0.05, sx * -0.6, 0, 7);
      g.fill();
      g.beginPath();
      g.moveTo(sx * 0.08, -0.14);
      g.lineTo(sx * 0.09, -0.24);
      g.stroke();
      dot(g, sx * 0.09, -0.25, 0.022);
    }
    if (!o.flat && o.accent) {
      g.fillStyle = o.accent;
      g.globalAlpha = 0.5;
      g.beginPath();
      g.ellipse(0, 0.03, 0.17, 0.08, 0, 0, 7);
      g.fill();
      g.globalAlpha = 1;
    }
  },
  molecrab(g, o) {
    g.beginPath();
    g.ellipse(0, 0, 0.32, 0.22, 0, 0, 7);
    g.fill();
    g.lineWidth = 0.02;
    g.strokeStyle = o.fill;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(-0.28, s * 0.04);
      g.quadraticCurveTo(-0.42, s * 0.16, -0.5, s * 0.1);
      g.stroke();
    }
    if (!o.flat && o.accent) {
      g.strokeStyle = o.accent;
      g.globalAlpha = 0.6;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(0.02, 0, 0.26 - i * 0.06, 0.2 - i * 0.02, 0, -1.2, 1.2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  },
  octopus(g, o) {
    g.beginPath();
    g.ellipse(-0.2, -0.06, 0.2, 0.17, -0.2, 0, 7);
    g.fill();
    g.lineCap = 'round';
    g.strokeStyle = o.fill;
    for (let i = 0; i < 7; i++) {
      const a = -0.9 + i * 0.32;
      g.lineWidth = 0.05 - i * 0.002;
      g.beginPath();
      g.moveTo(-0.08, 0.02);
      g.bezierCurveTo(0.1, a * 0.12, 0.25, a * 0.36 + 0.06, 0.38 + 0.08 * Math.cos(i * 1.7), a * 0.3 + 0.1 * Math.sin(i * 2.1));
      g.stroke();
    }
    if (!o.flat) {
      g.fillStyle = o.accent ?? '#fff';
      dot(g, -0.1, -0.02, 0.03);
      g.fillStyle = '#1b1b1b';
      dot(g, -0.1, -0.02, 0.014);
    }
  },
  conch(g, o) {
    g.beginPath();
    g.moveTo(-0.5, 0.05);
    g.quadraticCurveTo(-0.3, -0.26, 0.05, -0.22);
    g.lineTo(0.12, -0.3);
    g.lineTo(0.18, -0.2);
    g.lineTo(0.27, -0.24);
    g.lineTo(0.3, -0.13);
    g.lineTo(0.4, -0.13);
    g.lineTo(0.5, 0.0);
    g.quadraticCurveTo(0.3, 0.12, 0.1, 0.24);
    g.quadraticCurveTo(-0.25, 0.3, -0.5, 0.05);
    g.fill();
    if (!o.flat && o.accent) {
      g.fillStyle = o.accent;
      g.beginPath();
      g.moveTo(-0.42, 0.07);
      g.quadraticCurveTo(-0.15, -0.05, 0.12, 0.1);
      g.quadraticCurveTo(-0.15, 0.24, -0.42, 0.07);
      g.fill();
    }
  },
  turtle(g, o) {
    g.beginPath();
    g.ellipse(0.02, 0, 0.3, 0.22, 0, 0, 7);
    g.fill();
    g.beginPath();
    g.ellipse(-0.37, 0, 0.09, 0.065, 0, 0, 7);
    g.fill();
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(-0.2, s * 0.15);
      g.quadraticCurveTo(-0.3, s * 0.42, -0.02, s * 0.44);
      g.quadraticCurveTo(-0.1, s * 0.28, -0.02, s * 0.2);
      g.fill();
      g.beginPath();
      g.moveTo(0.22, s * 0.14);
      g.lineTo(0.42, s * 0.24);
      g.lineTo(0.3, s * 0.08);
      g.fill();
    }
    if (!o.flat && o.accent) {
      g.strokeStyle = o.accent;
      g.lineWidth = 0.012;
      g.globalAlpha = 0.6;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.ellipse(0.02, 0, 0.24 - i * 0.08, 0.17 - i * 0.055, 0, 0, 7);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  },
  ray(g, o) {
    g.beginPath();
    g.moveTo(-0.34, 0);
    g.quadraticCurveTo(-0.2, -0.2, -0.04, -0.36);
    g.quadraticCurveTo(0.08, -0.1, 0.14, -0.02);
    g.lineTo(0.5, 0);
    g.lineTo(0.14, 0.02);
    g.quadraticCurveTo(0.08, 0.1, -0.04, 0.36);
    g.quadraticCurveTo(-0.2, 0.2, -0.34, 0);
    g.fill();
    if (!o.flat) {
      g.fillStyle = 'rgba(0,0,0,0.5)';
      dot(g, -0.2, -0.05, 0.016);
      dot(g, -0.2, 0.05, 0.016);
    }
  },
  dolphin(g, o) {
    g.beginPath();
    g.moveTo(-0.5, 0.02);
    g.quadraticCurveTo(-0.44, -0.02, -0.4, -0.04);
    g.quadraticCurveTo(-0.2, -0.16, 0.0, -0.13);
    g.quadraticCurveTo(0.02, -0.26, 0.12, -0.27);
    g.quadraticCurveTo(0.08, -0.16, 0.13, -0.1);
    g.quadraticCurveTo(0.3, -0.05, 0.4, -0.01);
    g.lineTo(0.5, -0.1);
    g.quadraticCurveTo(0.46, 0.0, 0.5, 0.1);
    g.lineTo(0.4, 0.02);
    g.quadraticCurveTo(0.1, 0.12, -0.2, 0.1);
    g.lineTo(-0.16, 0.19);
    g.lineTo(-0.28, 0.09);
    g.quadraticCurveTo(-0.42, 0.07, -0.5, 0.02);
    g.fill();
    if (!o.flat) {
      g.fillStyle = '#1b1b1b';
      dot(g, -0.37, -0.01, 0.012);
    }
  },
};

/** Height over length for layout, so cards can size a specimen without drawing it. */
export function shapeAspect(shape: string): number {
  const f = FISH[shape];
  if (f) return Math.max(0.3, f.h + 0.34);
  return { eel: 0.3, lobster: 0.45, crab: 0.7, molecrab: 0.6, octopus: 0.6, conch: 0.65, turtle: 0.9, ray: 0.8, dolphin: 0.5 }[shape] ?? 0.5;
}

/** Shapes that are seen from above when cruising. */
export const TOP_DOWN = new Set(['turtle', 'ray', 'crab', 'lobster', 'octopus', 'conch', 'molecrab']);

/** Draw a creature in unit space (length 1, facing left). The caller sets the transform. */
export function drawShape(g: G, shape: string, o: DrawOpts): void {
  g.save();
  g.fillStyle = o.fill;
  const special = SPECIAL[shape];
  if (special) {
    special(g, o);
    g.restore();
    return;
  }
  const s = FISH[shape] ?? FISH.snapper;
  if (o.flat) {
    fishFins(g, s);
    fishBody(g, s);
    g.fill();
    g.restore();
    return;
  }
  // fins in the accent, behind the body
  g.fillStyle = o.accent ?? o.fill;
  fishFins(g, s);
  g.fillStyle = o.fill;
  fishBody(g, s);
  g.fill();
  g.save();
  fishBody(g, s);
  g.clip();
  if (o.accent) fishMarks(g, s, o.accent);
  // countershading: darker back, pale belly
  const grad = g.createLinearGradient(0, -s.h / 2, 0, s.h / 2);
  grad.addColorStop(0, 'rgba(20,40,60,0.28)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,0.4)');
  g.fillStyle = grad;
  g.fillRect(-0.6, -1, 1.2, 2);
  g.restore();
  // eye
  const ex = -0.5 + (s.beak ?? 0) + 0.075 + 0.03 * s.nose;
  const ey = -s.h * 0.1;
  const er = Math.max(0.014, Math.min(0.03, s.h * 0.075));
  g.fillStyle = '#f4f0e4';
  dot(g, ex, ey, er);
  g.fillStyle = '#14181c';
  dot(g, ex, ey, er * 0.58);
  g.restore();
}
