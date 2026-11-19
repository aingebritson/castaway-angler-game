/**
 * Writes art/prompts.md: a ready-to-paste prompt for every asset that is still
 * on a placeholder. Each prompt joins the style block and the per-type block
 * from art/style.md (the style bible) with the subject from the content files
 * and, for scenes, the layout the game needs (horizon, depth order, tap spots).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentNode } from '../src/content/loadNode';
import type { Location } from '../src/content/schema';
import { TOP_DOWN } from '../src/scenes/silhouettes';

const root = fileURLToPath(new URL('..', import.meta.url));
const { content } = loadContentNode();
const manifestPath = join(root, 'public/art/manifest.json');
const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

/** The ```text block under `### <name>` in art/style.md. */
const bible = existsSync(join(root, 'art/style.md')) ? readFileSync(join(root, 'art/style.md'), 'utf8') : '';
function block(name: string): string {
  // the heading, any notes under it (but not the next heading), then the fenced block
  const m = bible.match(new RegExp(`^### ${name}[ \\t]*\\n(?:(?!### )[\\s\\S])*?\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, 'm'));
  if (!m) throw new Error(`art/style.md has no "### ${name}" text block`);
  return m[1].trim();
}
const STYLE = block('Style');
const TYPE = {
  scene: block('Scene'),
  specimen: block('Specimen'),
  specimenAbove: block('Specimen from above'),
  item: block('Item'),
  portrait: block('Portrait'),
};

const where = (x: number, y: number) =>
  `${y < 0.45 ? 'upper' : y < 0.7 ? 'middle' : 'lower'} ${x < 0.34 ? 'left' : x > 0.66 ? 'right' : 'centre'}`;
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
/** "Tide pools" -> "tide pools", but leave names such as "Marisol’s Tackle" alone. */
const lower = (s: string) => (/[A-Z]/.test(s.slice(1)) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const PAINTED = new Set(['gather', 'market', 'board', 'shop', 'museum']);

function sceneLayout(l: Location): string {
  const parts: string[] = [];
  const water = l.scene.waterPolygon;
  if (water.length) {
    // Image models ignore exact percentages, so ask for a horizon about a third
    // down and fit the scene data (waterPolygon) to the image after it is chosen.
    parts.push('Seen from the shore looking out over the water. A straight sea horizon runs across the image about a third of the way down; above it are sky and any far headland.');
    const zones = l.zones.filter((z) => z.cast !== false).sort((a, b) => a.minCastRange - b.minCastRange);
    if (zones.length > 1) {
      const desc = zones.map((z) => (z.blurb ? `${lower(z.name)} (${lower(z.blurb.replace(/\.$/, ''))})` : lower(z.name)));
      parts.push(`Depth runs from near to far: the bottom of the frame is the nearest and shallowest water, then ${list(desc)} toward the horizon. The water gets steadily deeper and bluer with distance: clear and pale at the bottom of the image, deepest blue along the horizon.`);
    } else {
      parts.push('The water gets steadily deeper and bluer with distance: clear and pale nearest the shore, deepest blue along the horizon.');
    }
  }
  const painted = l.scene.hotspots.filter((h) => PAINTED.has(h.kind) && !h.showIf && !h.hideIf);
  if (painted.length) parts.push(`Show these where the game places its tap targets: ${list(painted.map((h) => `${lower(h.label)} at ${where(h.x, h.y)}`))}.`);
  const taken = new Set(painted.map((h) => where(h.x, h.y)));
  const clear = [...new Set(l.scene.hotspots.filter((h) => !painted.includes(h)).map((h) => where(h.x, h.y)))].filter((w) => !taken.has(w));
  if (clear.length) parts.push(`Keep the ${list(clear)} of the image plain and uncluttered; the game draws objects there itself.`);
  return parts.join(' ');
}

/** A short Midjourney prompt: it weights the first words and ignores long or negative instructions. */
function mjScene(l: Location): string {
  const painted = l.scene.hotspots.filter((h) => PAINTED.has(h.kind) && !h.showIf && !h.hideIf);
  const subject = `${l.name}, ${lower(l.habitat)}`;
  let layout: string;
  if (l.scene.waterPolygon.length) {
    const near = painted.filter((h) => h.y >= 0.7).map((h) => lower(h.label));
    const zones = l.zones.filter((z) => z.cast !== false).sort((a, b) => a.minCastRange - b.minCastRange).map((z) => lower(z.name));
    layout = ['View from the shore out to sea', near.length ? `${list(near)} in the foreground` : '', zones.length > 1 ? `then ${list(zones)} farther out` : '', 'deep blue sea and a straight horizon a third of the way down']
      .filter(Boolean).join(', ');
  } else {
    layout = painted.length ? `Showing ${list(painted.map((h) => lower(h.label)))}` : '';
  }
  return block('Midjourney scene').replace('{subject}', subject).replace('{layout}', layout ? `${layout}.` : '').replace(/ {2,}/g, ' ');
}

const out: string[] = [
  '# Art prompt sheet',
  '',
  'Generated by `npm run art:prompts` from the content files and the prompt blocks in `art/style.md`. Do not edit by hand.',
  '',
  'Paste each prompt into ChatGPT as it is. At the start of the conversation, upload the two references `art/style.md` lists for that asset type (under "Which references to upload"). Save the result under the name given, then run `npm run art:ingest`.',
  '',
  'After a scene is ingested, set the top of its `waterPolygon` in the location data to where the sea horizon sits in the image (0.33 means a third of the way down). The game measures its cast zones from that line.',
  '',
];
// `npm run art:prompts -- scene/rocky-point` prints just the named assets, art or not, to redo them
const only = new Set(process.argv.slice(2));
let n = 0;
const add = (id: string, kind: keyof typeof TYPE, subject: string, midjourney?: string) => {
  if (only.size ? !only.has(id) : manifest[id]) return;
  n++;
  out.push(`## ${id}`, '', `Save as \`art/inbox/${id.replace('/', '__')}.png\``, '', '```text', STYLE, '', TYPE[kind], '', subject, '```', '');
  if (midjourney) out.push('Midjourney version (add the reference images as style references):', '', '```text', midjourney, '```', '');
};

out.push('# Scenes', '');
for (const l of Object.values(content.locations)) {
  add(l.scene.background, 'scene', `Scene: ${l.name}, ${l.habitat.charAt(0).toLowerCase()}${l.habitat.slice(1)}. ${l.blurb}\n\n${sceneLayout(l)}`.trim(), mjScene(l));
}
out.push('# Specimens', '');
// crabs, lobsters, rays and the like are drawn from above, as the game shows them
for (const s of Object.values(content.species)) {
  add(`specimen/${s.id}`, TOP_DOWN.has(s.silhouette) ? 'specimenAbove' : 'specimen', `Subject: ${s.commonName} (${s.scientificName}). ${s.visualNotes}`);
}
out.push('# Items', '');
// Crafted gear says what it is made from; otherwise image models draw shop-bought tackle
const recipeFor = (itemId: string) => Object.values(content.recipes).find((r) => r.output.item === itemId && !r.special);
for (const i of Object.values(content.items)) {
  const r = recipeFor(i.id);
  const made = r ? ` Made by hand from ${list(r.inputs.map((x) => lower(content.items[x.item].name)))}: ${r.blurb.replace(/^[A-Z](?=[a-z ])/, (c) => c.toLowerCase())}` : '';
  add(`item/${i.id}`, 'item', [`Subject: ${i.name}. ${i.desc}${made}`, i.visualNotes].filter(Boolean).join(' '));
}
out.push('# Portraits', '');
for (const p of Object.values(content.people)) add(`portrait/${p.id}`, 'portrait', `Subject: ${p.name}, ${p.role}.`);

mkdirSync(join(root, 'art'), { recursive: true });
if (only.size) {
  const missing = [...only].filter((id) => !out.includes(`## ${id}`));
  if (missing.length) console.error(`No such asset: ${missing.join(', ')}`);
  // just the asset sections, without the sheet's headings
  const first = out.findIndex((l) => l.startsWith('## '));
  console.log(first < 0 ? '' : out.slice(first).filter((l) => !/^# /.test(l)).join('\n').trimEnd());
} else {
  writeFileSync(join(root, 'art/prompts.md'), out.join('\n'));
  console.log(`art/prompts.md: ${n} assets still need art`);
}
