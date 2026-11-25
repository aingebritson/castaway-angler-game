/**
 * Lessons: the castaway learns to fish by fishing. A lesson opens once its
 * prerequisites are learned and the things they taught have been made. From
 * then on it waits for something to happen (a missed bite, a short cast, a
 * line parting) and is taught the moment it does:
 *
 * - on a card in the castaway's words, or
 * - when it comes from the other castaway's journal, by a bottle on the very
 *   next cast, holding the page that explains it.
 *
 * Counts are measured from when the lesson opened, so each one follows from
 * what the player does with what they last made.
 */
import type { Content } from '../content/assemble';
import type { Lesson, LessonCond, LessonTrigger } from '../content/schema';
import { type Ctx, type GameEvent, fishKinds, has, log, sunAt } from './actions';
import type { GameState } from './state';

type Base = Record<string, number>;

/** Does one condition hold? Shared by lessons and thoughts. Lessons pass the counts at the moment they opened. */
export function holds(c: LessonCond, s: GameState, ctx: Ctx, base?: Base): boolean {
  switch (c.type) {
    case 'stat':
      return (s.stats[c.stat] ?? 0) - (base?.[`stat:${c.stat}`] ?? 0) >= c.min;
    case 'count':
      return (s.counts[c.key] ?? 0) - (base?.[c.key] ?? 0) >= c.min;
    case 'held':
      return !!s.everHeld[c.item];
    case 'kinds':
      return fishKinds(s, ctx.content) >= c.min;
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

/** Prerequisites learned and their lessons put to use. */
export function lessonOpen(l: Lesson, s: GameState): boolean {
  return !s.lessons.includes(l.id) && l.requires.every((r) => s.lessons.includes(r)) && l.after.every((i) => !!s.everHeld[i]);
}

const snapshot = (s: GameState): Base => ({ ...s.counts, 'stat:casts': s.stats.casts, 'stat:catches': s.stats.catches, 'stat:lost': s.stats.lost });

/** The trigger that teaches this lesson right now, if any. */
export function lessonTrigger(l: Lesson, s: GameState, ctx: Ctx): LessonTrigger | null {
  if (!lessonOpen(l, s)) return null;
  const base = s.opened[l.id];
  return l.triggers.find((t) => t.if.every((c) => holds(c, s, ctx, base))) ?? null;
}

/** The next lesson the player is working towards: prerequisites met, not yet learned. */
export function nextLesson(s: GameState, content: Content): Lesson | null {
  const region = content.locations[s.locationId]?.regionId;
  return content.lessons.find((l) => l.regionId === region && !s.lessons.includes(l.id) && l.requires.every((r) => s.lessons.includes(r))) ?? null;
}

export function teach(s: GameState, ctx: Ctx, l: Lesson, seen: string): void {
  s.lessons.push(l.id);
  for (const r of l.unlocks.recipes) if (!s.recipesKnown.includes(r)) s.recipesKnown.push(r);
  for (const f of l.unlocks.flags) s.flags[f] = true;
  log(s, ctx, 'lesson', `${l.title}. ${seen}`);
}

/** Teach at most one lesson whose moment has come. Called after every action. */
export function checkLessons(s: GameState, ctx: Ctx): GameEvent[] {
  if (!s.flags.hasRod || s.flags.launched) return [];
  // The opening walkthrough has the floor until the first fish is in hand.
  if (s.stats.catches === 0 && !s.flags.tutDone) return [];
  // Start each open lesson's clock the moment it opens.
  for (const l of ctx.content.lessons) if (!s.opened[l.id] && lessonOpen(l, s)) s.opened[l.id] = snapshot(s);
  for (const l of ctx.content.lessons) {
    const t = lessonTrigger(l, s, ctx);
    if (!t) continue;
    if (l.via) {
      // The page comes up on the next cast; one bottle at a time.
      if (s.stage) continue;
      s.stage = { lesson: l.id, seen: t.seen };
      return [];
    }
    teach(s, ctx, l, t.seen);
    return [{ type: 'lesson', lessonId: l.id, seen: t.seen }, { type: 'sfx', id: 'page' }];
  }
  return [];
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
    if (s.flags.launched || madeIt || (l.unlocks.flags.length && l.unlocks.flags.every((f) => s.flags[f]))) add(l.id);
  }
  if (s.everHeld['stone-knife']) add('cutbait');
  if (s.visited.lagoon) add('sight');
  for (const l of content.lessons) {
    if (!learn.has(l.id) || s.lessons.includes(l.id)) continue;
    s.lessons.push(l.id);
    for (const r of l.unlocks.recipes) if (!s.recipesKnown.includes(r)) s.recipesKnown.push(r);
    for (const f of l.unlocks.flags) s.flags[f] = true;
  }
  if (s.stage && s.lessons.includes(s.stage.lesson)) s.stage = null;
  // Pages delivered so far, by the lessons they carry.
  s.pagesFound = Math.max(s.pagesFound, content.pages.filter((p) => p.lesson && s.lessons.includes(p.lesson)).length);
}
