/**
 * Thoughts: the castaway's own voice carries the story. They come once each,
 * spaced out, and the next goal is only said out loud when it matters.
 */
import { describe, expect, it } from 'vitest';
import { runPace } from '../scripts/lib/paceBot';
import { loadContentNode } from '../src/content/loadNode';
import { type Ctx, gather, pickup, travel } from '../src/state/actions';
import { checkThoughts, fillThought, syncThoughts } from '../src/state/thoughts';
import { migrate, newGame } from '../src/state/state';

const { content } = loadContentNode();
const START = Date.parse('2027-02-01T14:00:00Z');
const ctx = (now = START): Ctx => ({ content, now, deviceTz: 'America/Belize' });
const runs = [1, 2, 3].map((seed) => runPace(content, seed));

describe('thoughts', () => {
  it('the story arrives: the rod, the first fish, the other castaway, a hundred fish, the bearing', () => {
    for (const r of runs) {
      const ids = r.thoughts.map((t) => t.id);
      for (const id of ['the-rod', 'first-fish', 'shell-hook', 'the-other-castaway', 'ten', 'fifty', 'hundred', 'bearing', 'ready']) expect(ids, id).toContain(id);
      expect(new Set(ids.filter((i) => !i.startsWith('mind:'))).size).toBe(ids.filter((i) => !i.startsWith('mind:')).length);
    }
  });

  it('every island thought that follows from fishing itself is had in a playthrough', () => {
    // Days need real days to pass, and stolen bait and thrown hooks are luck; the rest must all come.
    const luck = (t: (typeof content.thoughts)[number]) => t.when.every((g) => g.some((c) => c.type === 'day' || (c.type === 'count' && ['stolen', 'pulled'].includes(c.key))));
    const island = content.thoughts.filter((t) => t.regionId === 'castaway-island' && !luck(t)).map((t) => t.id);
    const had = new Set(runs.flatMap((r) => r.thoughts.map((t) => t.id)));
    expect(island.filter((id) => !had.has(id))).toEqual([]);
  });

  it('nothing is said twice, and the castaway never nags', () => {
    for (const r of runs) {
      const said = r.thoughts.filter((t) => t.id.startsWith('mind:')).map((t) => t.id);
      expect(new Set(said).size).toBe(said.length);
      // Goals are said when something prompts them, not on a timer: a handful per lesson at most.
      expect(said.length).toBeLessThan(content.lessons.length * 4);
    }
  });

  it('thoughts about a page come with the page', () => {
    for (const r of runs) {
      for (const [id, n] of [['the-other-castaway', 1], ['tide', 3], ['friend', 5], ['leaving', 9], ['bearing', 10]] as const) {
        const th = r.thoughts.find((t) => t.id === id)!;
        const page = r.events.find((e) => e.what === `page ${n}`)!;
        expect(Math.abs(th.minute - page.minute), id).toBeLessThan(0.5);
      }
    }
  });

  it('says where a missing part is when the castaway walks into that place', () => {
    const s = newGame(13, START);
    s.flags.tutDone = true;
    pickup(s, ctx(), 'start-rod');
    s.everHeld['sand-flea'] = true;
    s.stats.catches = 6;
    s.lessons.push('hooks');
    s.recipesKnown.push('shell-hook');
    s.thoughts = content.thoughts.map((t) => t.id);
    s.inventory.shell = 1;
    s.locationId = 'rocky-point';
    expect(checkThoughts(s, ctx())).toEqual([]);
    travel(s, ctx(), 'beach');
    const ev = checkThoughts(s, ctx());
    expect(ev).toEqual([expect.objectContaining({ type: 'thought', mind: true })]);
    travel(s, ctx(), 'rocky-point');
    checkThoughts(s, ctx());
    travel(s, ctx(), 'beach');
    expect(checkThoughts(s, ctx())).toEqual([]);
  });

  it('says the next thing out loud once it is ready to do, and not again straight away', () => {
    const s = newGame(9, START);
    s.flags.tutDone = true;
    pickup(s, ctx(), 'start-rod');
    s.stats.catches = 6;
    s.stats.casts = 40;
    s.lessons.push('hooks');
    s.recipesKnown.push('shell-hook');
    s.thoughts = content.thoughts.map((t) => t.id);
    delete s.inventory['rusty-hook'];
    s.inventory.shell = 2;
    s.everHeld['sand-flea'] = true;
    const ev = checkThoughts(s, ctx());
    expect(ev).toEqual([expect.objectContaining({ type: 'thought', mind: true })]);
    expect((ev[0] as { lines: string[] }).lines[0]).toMatch(/shell hook/);
    s.stats.casts += 10;
    expect(checkThoughts(s, ctx())).toEqual([]);
  });

  it('counts days by the calendar and fills them in', () => {
    const s = newGame(10, START);
    checkThoughts(s, ctx());
    expect(s.days.n).toBe(1);
    checkThoughts(s, ctx(START + 3_600_000));
    expect(s.days.n).toBe(1);
    checkThoughts(s, ctx(START + 26 * 3_600_000));
    expect(s.days.n).toBe(2);
    expect(fillThought('I have been here {days}.', s, content)).toBe('I have been here 2 days.');
  });

  it('an old save is not flooded with everything it would already have thought', () => {
    const s = newGame(11, START);
    pickup(s, ctx(), 'start-rod');
    gather(s, ctx(), 'swash');
    s.stats.catches = 60;
    s.stats.casts = 200;
    const old = { ...structuredClone(s), v: 3 } as Record<string, unknown>;
    delete old.thoughts;
    delete old.mind;
    delete old.days;
    const up = migrate(old, START);
    syncThoughts(up, ctx());
    for (const id of ['the-rod', 'first-fish', 'ten', 'fifty']) expect(up.thoughts).toContain(id);
    expect(up.flags.syncThoughts).toBeUndefined();
    const fresh = newGame(12, START);
    syncThoughts(fresh, ctx());
    expect(fresh.thoughts).toEqual([]);
  });
});
