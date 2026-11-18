/**
 * Lessons: the castaway learns to fish by fishing. Each lesson waits for
 * something to happen (a hook bending, a missed bite, a line parting), then
 * explains one idea and unlocks what it lets you make or reach.
 *
 * Lessons are checked after every action and taught one at a time, so the
 * player gets one new idea, uses it, and then the next one arrives.
 */
import type { Content } from '../content/assemble';
import type { Lesson, LessonCond } from '../content/schema';
import { type Ctx, type GameEvent, has, log, speciesCaught, sunAt } from './actions';
import type { GameState } from './state';

/** Does one condition hold? Shared by lessons and thoughts. */
export function holds(c: LessonCond, s: GameState, ctx: Ctx): boolean {
  switch (c.type) {
    case 'stat':
      return (s.stats[c.stat] ?? 0) >= c.min;
    case 'count':
      return (s.counts[c.key] ?? 0) >= c.min;
    case 'held':
      return !!s.everHeld[c.item];
    case 'kinds':
      return speciesCaught(s, ctx.content) >= c.min;
    case 'phase':
      return c.phases.includes(sunAt(ctx, s.locationId).phase);
    case 'at':
      return s.locationId === c.location;
    case 'hookless':
      return !!s.flags.hasRod && !Object.keys(s.inventory).some((id) => has(s, id) && ctx.content.items[id]?.kind === 'hook');
    case 'day':
      return s.days.n >= c.min;
    case 'pages':
      return s.pagesFound >= c.min;
    case 'know':
      return s.lessons.includes(c.lesson);
    case 'flag':
      return !!s.flags[c.flag];
  }
}

/** Is this lesson ready to be learned right now? */
export function lessonReady(l: Lesson, s: GameState, ctx: Ctx): boolean {
  if (s.lessons.includes(l.id)) return false;
  if (!l.requires.every((r) => s.lessons.includes(r))) return false;
  return l.when.some((group) => group.every((c) => holds(c, s, ctx)));
}

/** The next lesson the player is working towards: prerequisites met, not yet learned. */
export function nextLesson(s: GameState, content: Content): Lesson | null {
  const region = content.locations[s.locationId]?.regionId;
  return content.lessons.find((l) => l.regionId === region && !s.lessons.includes(l.id) && l.requires.every((r) => s.lessons.includes(r))) ?? null;
}

function teach(s: GameState, ctx: Ctx, l: Lesson): void {
  s.lessons.push(l.id);
  for (const r of l.unlocks.recipes) if (!s.recipesKnown.includes(r)) s.recipesKnown.push(r);
  for (const f of l.unlocks.flags) s.flags[f] = true;
}

/** Teach at most one lesson that has become ready. Called after every action. */
export function checkLessons(s: GameState, ctx: Ctx): GameEvent[] {
  if (!s.flags.hasRod || s.flags.launched) return [];
  // The opening walkthrough has the floor until the first fish is in hand.
  if (s.stats.catches === 0 && !s.flags.tutDone) return [];
  const sinceLast = s.stats.casts - (s.counts.castsAtLesson ?? -999);
  const l = ctx.content.lessons.find((x) => lessonReady(x, s, ctx) && (!x.gap || sinceLast >= ctx.content.balance.lessons.gapCasts));
  if (!l) return [];
  teach(s, ctx, l);
  s.counts.castsAtLesson = s.stats.casts;
  log(s, ctx, 'lesson', `${l.title}. ${l.seen}`);
  return [{ type: 'lesson', lessonId: l.id }, { type: 'sfx', id: 'page' }];
}

/**
 * Saves from before lessons existed: count as learned every lesson whose
 * recipe the player has already made, and everything it depended on.
 * Players who have left the island have learned them all.
 */
export function syncLessons(s: GameState, content: Content): void {
  const learn = new Set(s.lessons);
  const add = (id: string) => {
    if (learn.has(id)) return;
    learn.add(id);
    content.lessons.find((l) => l.id === id)?.requires.forEach(add);
  };
  for (const l of content.lessons) {
    const madeIt = l.unlocks.recipes.some((r) => s.everHeld[content.recipes[r]?.output.item]);
    if (s.flags.launched || madeIt) add(l.id);
  }
  if (s.everHeld['stone-knife']) add('cutbait');
  if (s.visited.lagoon) add('sight');
  for (const l of content.lessons) {
    if (!learn.has(l.id) || s.lessons.includes(l.id)) continue;
    s.lessons.push(l.id);
    for (const r of l.unlocks.recipes) if (!s.recipesKnown.includes(r)) s.recipesKnown.push(r);
    for (const f of l.unlocks.flags) s.flags[f] = true;
  }
}
