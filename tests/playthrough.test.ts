/**
 * The island, played through the real rules at human speed by the pacing bot
 * (scripts/lib/paceBot.ts). If this passes there is a way off the island that
 * never gets stuck, and the lessons arrive at the pace the design asks for.
 */
import { describe, expect, it } from 'vitest';
import { runPace } from '../scripts/lib/paceBot';
import { loadContentNode } from '../src/content/loadNode';
import { type Ctx, beginCast, craft, gather, keepFish, landFish, landJunk, pickup, recordCatch, rollBite, travel } from '../src/state/actions';
import { nextGoal } from '../src/state/goals';
import { checkLessons, nextLesson, syncLessons } from '../src/state/lessons';
import { decodeSave, encodeSave, migrate, newGame } from '../src/state/state';

const { content } = loadContentNode();
const START = '2027-02-01T14:00:00Z';
const ctx = (now = Date.parse(START)): Ctx => ({ content, now, deviceTz: 'America/Belize' });
const runs = [1, 2, 3, 4, 5].map((seed) => runPace(content, seed));
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const when = (what: string) => median(runs.map((r) => r.milestones[what] ?? Infinity));

describe('castaway playthrough', () => {
  it('every run gets off the island, having learned every lesson', () => {
    for (const r of runs) {
      expect(r.launched, `seed run took ${r.minutes.toFixed(0)} min`).toBe(true);
      const island = content.lessons.filter((l) => l.regionId === 'castaway-island').map((l) => l.id);
      expect(r.state.lessons.sort()).toEqual(island.sort());
    }
  });

  it('eases in: the knife, the rod and the raft arrive when the design wants them', () => {
    // Andy, 18 Nov 2026: the knife in five minutes and the bamboo rod in fifteen was a firehose.
    expect(when('made: stone-knife')).toBeGreaterThan(8);
    expect(when('made: bamboo-rod')).toBeGreaterThan(40);
    // Spec section 6: waking up to launching the raft takes two to four hours of play.
    expect(when('launched')).toBeGreaterThan(110);
    expect(when('launched')).toBeLessThan(240);
    console.log(`pace: knife ${when('made: stone-knife').toFixed(0)} min, bamboo rod ${when('made: bamboo-rod').toFixed(0)} min, launch ${when('launched').toFixed(0)} min of play`);
  });

  it('the other castaway’s pages arrive in order, one per lesson, never two at once', () => {
    for (const r of runs) {
      const pages = r.events.filter((e) => /^page \d+$/.test(e.what));
      expect(pages.map((e) => e.what)).toEqual(content.pages.map((_, i) => `page ${i + 1}`));
      const gaps = pages.slice(1).map((e, i) => e.minute - pages[i].minute);
      expect(Math.min(...gaps)).toBeGreaterThan(1);
    }
  });

  it('the rusty hook gives out on the fifth fish, and that teaches hooks at once', () => {
    const s = newGame(5, Date.parse(START));
    s.flags.tutDone = true;
    pickup(s, ctx(), 'start-rod');
    s.stats.catches = 4;
    const bite = { kind: 'fish' as const, speciesId: 'abudefduf-saxatilis', lengthCm: 14, weightG: 60, grade: 'average' as const, percentile: 0.5, ratio: 0.2, outcome: 'fight' as const, hookWindowS: 1 };
    landFish(s, ctx(), bite, 'shallows');
    expect(s.inventory['rusty-hook']).toBeUndefined();
    const ev = checkLessons(s, ctx());
    expect(ev[0]).toMatchObject({ type: 'lesson', lessonId: 'hooks' });
    expect(s.recipesKnown).toContain('shell-hook');
  });

  it('a page comes up on the very next cast after its moment, and teaches its lesson', () => {
    const s = newGame(6, Date.parse(START));
    s.flags.tutDone = true;
    pickup(s, ctx(), 'start-rod');
    s.stats.catches = 6;
    s.lessons.push('hooks');
    s.everHeld['shell-hook'] = true;
    s.inventory['sand-flea'] = 5;
    s.rig.bait = 'sand-flea';
    // Fish kept before the lesson opened do not count: it follows from what happens next.
    s.counts.kept = 9;
    checkLessons(s, ctx());
    expect(s.opened.edge).toBeTruthy();
    expect(s.stage).toBeNull();
    s.counts.kept += 4;
    expect(checkLessons(s, ctx())).toEqual([]);
    expect(s.stage?.lesson).toBe('edge');
    const plan = beginCast(s, ctx(), 'shallows', 0.6);
    expect(plan?.active).toBe(true);
    const bite = rollBite(s, ctx(), 'shallows');
    expect(bite).toEqual({ kind: 'junk', itemId: 'message-bottle' });
    const ev = landJunk(s, ctx(), 'message-bottle');
    expect(ev).toEqual([expect.objectContaining({ type: 'page', pageId: 'page-1', lessonId: 'edge', seen: expect.stringMatching(/Four fish/) })]);
    expect(s.recipesKnown).toContain('stone-knife');
    expect(s.stage).toBeNull();
    expect(landJunk(s, ctx(), 'message-bottle')).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'gain', itemId: 'sea-glass' })]));
  });

  it('the Thinking note always has something to say before the raft is ready', () => {
    const s = runs[0].state;
    expect(s.flags.launched).toBe(true);
    const fresh = newGame(3, Date.parse(START));
    fresh.flags.introSeen = true;
    pickup(fresh, ctx(), 'start-rod');
    for (let i = 0; i < 3; i++) gather(fresh, ctx(), 'swash');
    expect(nextGoal(fresh, content)?.text).toBeTruthy();
  });

  it('nothing can be made before it is learned', () => {
    const s = newGame(4, Date.parse(START));
    pickup(s, ctx(), 'start-rod');
    s.inventory.stone = 4;
    s.inventory.vine = 2;
    s.inventory.hammerstone = 1;
    expect(craft(s, ctx(), 'stone-knife').some((e) => e.type === 'toast' && e.tone === 'warn')).toBe(true);
    expect(s.inventory['stone-knife']).toBeUndefined();
  });

  it('a lost hook teaches the shell hook at once, so no one is ever stuck', () => {
    const s = newGame(5, Date.parse(START));
    s.flags.tutDone = true;
    pickup(s, ctx(), 'start-rod');
    delete s.inventory['rusty-hook'];
    expect(nextLesson(s, content)?.id).toBe('hooks');
    const ev = checkLessons(s, ctx());
    expect(ev.some((e) => e.type === 'lesson')).toBe(true);
    expect(s.recipesKnown).toContain('shell-hook');
  });

  it('camp, the grove and the lagoon open as lessons call for them', () => {
    const s = newGame(6, Date.parse(START));
    const open = (id: string) => content.locations[id].unlock.every((u) => u.type !== 'lesson' || s.lessons.includes(u.lesson));
    expect(open('camp') || open('grove') || open('lagoon')).toBe(false);
    s.lessons.push('hooks');
    expect(open('camp')).toBe(true);
    expect(open('grove')).toBe(false);
  });

  it('old saves keep what they have made', () => {
    const s = newGame(7, Date.parse(START));
    s.flags.hasRod = true;
    s.everHeld['stone-knife'] = true;
    s.everHeld['bamboo-rod'] = true;
    syncLessons(s, content);
    for (const id of ['hooks', 'edge', 'cutbait', 'hooksize', 'cord', 'sinker', 'line', 'rod']) expect(s.lessons).toContain(id);
    expect(s.recipesKnown).toContain('bamboo-rod');
    expect(s.lessons).not.toContain('night');
    const launched = newGame(8, Date.parse(START));
    launched.flags.launched = true;
    syncLessons(launched, content);
    expect(launched.lessons.length).toBe(content.lessons.filter((l) => l.regionId === 'castaway-island').length);
  });

  it('hand-gathered bait creatures are recorded but do not count as catches', () => {
    const s = newGame(5, Date.parse(START));
    gather(s, ctx(), 'swash');
    expect(s.guide['emerita-portoricensis']?.state).toBe('caught');
    expect(s.stats.catches).toBe(0);
    expect(s.inventory['sand-flea']).toBe(1);
  });

  it('release-only animals cannot be kept', () => {
    const s = newGame(6, Date.parse(START));
    pickup(s, ctx(), 'start-rod');
    travel(s, ctx(), 'lagoon');
    const sp = content.species['megalops-atlanticus'];
    const r = recordCatch(s, ctx(), { kind: 'fish', speciesId: sp.id, lengthCm: 120, weightG: 12000, grade: 'average', percentile: 0.5, ratio: 0.5, outcome: 'fight', hookWindowS: 1 }, 'channel', 'rod');
    expect(r.releaseOnly).toBe(true);
    keepFish(s, ctx(), r);
    expect(s.creel).toHaveLength(0);
    expect(s.guide[sp.id].released).toBe(1);
  });

  it('save codes round-trip and old saves migrate', () => {
    const s = newGame(7, Date.parse(START));
    pickup(s, ctx(), 'start-rod');
    gather(s, ctx(), 'swash');
    const now = Date.parse(START);
    expect(decodeSave(encodeSave(s), now)).toEqual(s);
    expect(() => decodeSave('nonsense', now)).toThrow();
    const old = { ...structuredClone(s), v: 1 } as Record<string, unknown>;
    delete old.larder;
    delete old.quests;
    delete old.lessons;
    delete old.counts;
    const up = migrate(old, now);
    expect(up.larder).toEqual([]);
    expect(up.lessons).toEqual([]);
    expect(up.counts).toEqual({});
    expect(up.inventory['old-rod']).toBe(1);
    expect(() => migrate({ v: 999 }, now)).toThrow();
  });
});
