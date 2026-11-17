/** Node loader: reads /content from disk. Used by scripts and tests. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleContent, type Content, type Issues, type RawFiles } from './assemble';

export const CONTENT_DIR = fileURLToPath(new URL('../../content', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });
}

export function readContentFiles(dir = CONTENT_DIR): RawFiles {
  const files: RawFiles = {};
  for (const p of walk(dir)) {
    const key = relative(dir, p).split('\\').join('/');
    try {
      files[key] = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      throw new Error(`${key}: invalid JSON (${(e as Error).message})`);
    }
  }
  return files;
}

export function loadContentNode(): { content: Content; issues: Issues } {
  return assembleContent(readContentFiles());
}
