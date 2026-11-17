/**
 * Content validation. The build fails if a file breaks its schema, points to a
 * missing id, or lacks a source. Missing art and unverified sources are reported.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentNode } from '../src/content/loadNode';

const root = fileURLToPath(new URL('..', import.meta.url));
const { content, issues } = loadContentNode();

const manifestPath = join(root, 'public/art/manifest.json');
const manifest: Record<string, string> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const wanted: string[] = [
  ...Object.keys(content.species).map((id) => `specimen/${id}`),
  ...Object.keys(content.items).map((id) => `item/${id}`),
  ...Object.values(content.locations).map((l) => l.scene.background),
  ...Object.keys(content.people).map((id) => `portrait/${id}`),
];
const missingArt = wanted.filter((id) => !manifest[id]);

const n = (o: object) => Object.keys(o).length;
console.log(
  `content: ${n(content.species)} species, ${content.occurrences.length} occurrences, ${n(content.locations)} locations, ` +
    `${n(content.items)} items, ${n(content.recipes)} recipes, ${n(content.rumours)} rumours, ${content.pages.length} pages, ` +
    `${n(content.people)} people, ${n(content.quests)} quests`,
);
for (const w of issues.warnings) console.log(`  warn: ${w}`);
console.log(`  art: ${wanted.length - missingArt.length}/${wanted.length} assets present; ${missingArt.length} on placeholders`);
if (process.argv.includes('--list-art')) for (const m of missingArt) console.log(`    missing ${m}`);
if (issues.errors.length) {
  console.error(`\n${issues.errors.length} content error(s):`);
  for (const e of issues.errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('  ✓ content valid');
