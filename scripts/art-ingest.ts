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
  if (rule.alpha) {
    const stats = meta.hasAlpha ? await img.clone().extractChannel('alpha').stats() : null;
    // below 16 counts as clear: the haze cleared below
    if (!stats || stats.channels[0].min >= 16) {
      console.log(`  ✗ ${f}: needs a transparent background`);
      continue;
    }
  }
  let pipe = img.clone();
  if (rule.alpha) {
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
  console.log(`  ✓ ${id}${problems.length ? ` (check: ${problems.join('; ')})` : ''}`);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`ingested ${ok} of ${files.length} file(s); manifest has ${Object.keys(manifest).length} asset(s)`);
