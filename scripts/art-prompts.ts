/**
 * Writes art/prompts.md: one prompt for every asset that is still on a
 * placeholder, built from the shared style block, the content files and the
 * format rules in spec section 13.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentNode } from '../src/content/loadNode';

const root = fileURLToPath(new URL('..', import.meta.url));
const { content } = loadContentNode();
const manifestPath = join(root, 'public/art/manifest.json');
const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const stylePath = join(root, 'art/style.md');
const style = existsSync(stylePath)
  ? readFileSync(stylePath, 'utf8').trim()
  : 'STYLE (replace with the style bible once the bake-off is decided; save it as art/style.md): simplified field-guide watercolour, one outline weight, light from the upper left, no text, no borders, no drop shadows.';

const out: string[] = ['# Art prompt sheet', '', `Generated from the content files. ${style}`, ''];
let n = 0;
const add = (id: string, file: string, subject: string, rules: string) => {
  if (manifest[id]) return;
  n++;
  out.push(`## ${id}`, '', `- **Save as:** \`art/inbox/${file}\``, `- **Subject:** ${subject}`, `- **Format:** ${rules}`, '');
};

out.push('# Scenes', '');
for (const l of Object.values(content.locations)) {
  add(l.scene.background, `${l.scene.background.replace('/', '__')}.png`, `${l.name}: ${l.habitat}. ${l.blurb}`,
    'Portrait 1290 × 2796. Water in the lower 55 to 60 percent where the scene has sea. No characters. Neutral midday light; the game tints for dawn, dusk and night.');
}
out.push('# Specimens', '');
for (const s of Object.values(content.species)) {
  add(`specimen/${s.id}`, `specimen__${s.id}.png`, `${s.commonName} (${s.scientificName}). ${s.visualNotes}`,
    '1536 × 1024, transparent background, side profile facing left, fins extended. Anatomy must be correct: fin count and position, body shape, tail shape, mouth position, key markings.');
}
out.push('# Items', '');
for (const i of Object.values(content.items)) {
  add(`item/${i.id}`, `item__${i.id}.png`, `${i.name}. ${i.desc}`, '512 × 512, transparent background, three-quarter view, centred.');
}
out.push('# Portraits', '');
for (const p of Object.values(content.people)) {
  add(`portrait/${p.id}`, `portrait__${p.id}.png`, `${p.name}, ${p.role}.`, '1024 × 1024, bust.');
}
mkdirSync(join(root, 'art'), { recursive: true });
writeFileSync(join(root, 'art/prompts.md'), out.join('\n'));
console.log(`art/prompts.md: ${n} assets still need art`);
