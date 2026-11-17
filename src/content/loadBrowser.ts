/** Browser loader: Vite inlines every JSON file under /content at build time. */
import { assembleContent, type Content, type RawFiles } from './assemble';

const modules = import.meta.glob('../../content/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export function loadContent(): Content {
  const files: RawFiles = {};
  for (const [path, data] of Object.entries(modules)) files[path.replace(/^.*\/content\//, '')] = data;
  const { content, issues } = assembleContent(files);
  if (issues.errors.length) console.error('Content errors:\n' + issues.errors.join('\n'));
  return content;
}
