/**
 * Pacing simulator: plays the island at human speed and prints when each
 * lesson and milestone arrives.
 *   npm run pace -- [--seeds 5] [--start 2027-02-01T14:00:00Z]
 */
import { loadContentNode } from '../src/content/loadNode';
import { runPace } from './lib/paceBot';

const args = process.argv.slice(2);
const opt = (n: string, d: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const { content } = loadContentNode();
const seeds = Number(opt('seeds', '5'));
const start = opt('start', '2027-02-01T14:00:00Z');
const all: Record<string, number[]> = {};
for (let seed = 1; seed <= seeds; seed++) {
  const r = runPace(content, seed, start);
  if (seed === 1) {
    console.log(`\nSeed 1 timeline (minutes of play, human pace):`);
    const merged = [...r.events.map((e) => ({ minute: e.minute, what: e.what })), ...r.thoughts.map((x) => ({ minute: x.minute, what: `  … ${x.id.slice(0, 70)}` }))];
    for (const e of merged.sort((a, b) => a.minute - b.minute)) console.log(`  ${String(e.minute).padStart(6)}  ${e.what}`);
    const story = r.thoughts.filter((x) => !x.id.startsWith('mind:')).length;
    console.log(`  thoughts: ${story} story, ${r.thoughts.length - story} on my mind`);
  }
  for (const [k, v] of Object.entries(r.milestones)) (all[k] ??= []).push(v);
  if (!r.launched) (all['NOT LAUNCHED'] ??= []).push(r.minutes);
}
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
console.log(`\nMedian over ${seeds} seeds:`);
for (const [k, v] of Object.entries(all).sort((a, b) => median(a[1]) - median(b[1]))) {
  console.log(`  ${median(v).toFixed(0).padStart(5)} min  ${k}${v.length < seeds ? ` (${v.length}/${seeds} runs)` : ''}`);
}
