/**
 * Ingests images from art/inbox/. File names are the asset id with "/" written
 * as "__", e.g. specimen__albula-vulpes.png or scene__beach.png. Checks size
 * and transparency, trims, converts to WebP and updates the manifest.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const inbox = join(root, 'art/inbox');
const outDir = join(root, 'public/art');
const manifestPath = join(outDir, 'manifest.json');
mkdirSync(outDir, { recursive: true });
const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const RULES: Record<string, { w: number; h: number; alpha: boolean; trim: boolean; max: number }> = {
  scene: { w: 1290, h: 2796, alpha: false, trim: false, max: 1290 },
  specimen: { w: 1536, h: 1024, alpha: true, trim: true, max: 1024 },
  item: { w: 512, h: 512, alpha: true, trim: true, max: 256 },
  portrait: { w: 1024, h: 1024, alpha: false, trim: false, max: 512 },
};

/**
 * Image models sometimes return a cut-out on plain white, or on a painted
 * grey-and-white checkerboard, instead of real transparency. When the border
 * is all pale and neutral, flood-fill it from the edges (the ink outline
 * stops the fill) and fade the pale fringe next to it. Null when the border
 * isn't a plain light background, so a real painted background is still
 * rejected.
 */
async function keyLightBackground(img: ReturnType<typeof sharp>): Promise<ReturnType<typeof sharp> | null> {
  const { data, info } = await img.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const lo = new Uint8Array(n);
  const pale = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    lo[p] = Math.min(r, g, b);
    pale[p] = lo[p] >= 228 && Math.max(r, g, b) - lo[p] <= 14 ? 1 : 0;
  }
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  if (border.filter((p) => pale[p]).length < border.length * 0.97) return null;
  const bg = new Uint8Array(n);
  const stack = border.filter((p) => pale[p]);
  for (const p of stack) bg[p] = 1;
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
      if (q >= 0 && q < n && !bg[q] && pale[q]) {
        bg[q] = 1;
        stack.push(q);
      }
    }
  }
  const out = Buffer.alloc(n * 4);
  for (let p = 0; p < n; p++) {
    out[p * 4] = data[p * 3];
    out[p * 4 + 1] = data[p * 3 + 1];
    out[p * 4 + 2] = data[p * 3 + 2];
    let a = 255;
    if (bg[p]) a = 0;
    else {
      // within 2 px of the background: fade pale pixels so no white rim is left
      const x = p % w, y = (p - x) / w;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++)
        for (let dx = -2; dx <= 2 && !near; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < w && yy >= 0 && yy < h && bg[yy * w + xx]) near = true;
        }
      if (near && lo[p] > 190) a = Math.round((255 * (255 - lo[p])) / 65);
    }
    out[p * 4 + 3] = a;
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } });
}

const files = existsSync(inbox) ? readdirSync(inbox).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
let ok = 0;
for (const f of files) {
  // accept scene__beach.png and the easy-to-type scene_beach.png
  const id = f.replace(/\.[^.]+$/, '').replace(/^(scene|specimen|item|portrait)__?/, '$1/');
  const kind = id.split('/')[0];
  const rule = RULES[kind];
  if (!rule) {
    console.log(`  skip ${f}: name must start with scene__, specimen__, item__ or portrait__`);
    continue;
  }
  const img = sharp(join(inbox, f));
  const meta = await img.metadata();
  const problems: string[] = [];
  if ((meta.width ?? 0) < rule.w * 0.6 || (meta.height ?? 0) < rule.h * 0.6) problems.push(`small (${meta.width}×${meta.height}, want about ${rule.w}×${rule.h})`);
  const ratio = (meta.width ?? 1) / (meta.height ?? 1);
  if (Math.abs(ratio - rule.w / rule.h) > 0.12) problems.push(`aspect ${ratio.toFixed(2)}, want ${(rule.w / rule.h).toFixed(2)}`);
  let pipe = img.clone();
  let keyed = false;
  if (rule.alpha) {
    const stats = meta.hasAlpha ? await img.clone().extractChannel('alpha').stats() : null;
    // below 16 counts as clear: the haze cleared below
    if (!stats || stats.channels[0].min >= 16) {
      const cut = await keyLightBackground(img);
      if (!cut) {
        console.log(`  ✗ ${f}: needs a transparent background`);
        continue;
      }
      pipe = cut;
      keyed = true;
    }
  }
  if (rule.alpha && !keyed) {
    // ChatGPT cut-outs can carry a near-invisible haze over the background
    // (alpha 1-15), which shows as a faint box and stops the trim. Clear it,
    // and make bodies drawn at alpha 250-254 fully solid.
    const { data, info } = await img.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) data[i] = data[i] < 16 ? 0 : data[i] >= 250 ? 255 : data[i];
    pipe = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  }
  if (rule.trim) pipe = pipe.trim();
  const file = `${id.replace('/', '__')}.webp`;
  await pipe.resize({ width: rule.max, height: rule.max * 3, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toFile(join(outDir, file));
  manifest[id] = file;
  ok++;
  if (keyed) problems.push('white background removed by ingest; look at the edges');
  console.log(`  ✓ ${id}${problems.length ? ` (check: ${problems.join('; ')})` : ''}`);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`ingested ${ok} of ${files.length} file(s); manifest has ${Object.keys(manifest).length} asset(s)`);
