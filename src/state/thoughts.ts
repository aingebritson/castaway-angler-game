/**
 * Thoughts: the castaway talking to themself. Two kinds:
 *
 * - Story thoughts (content/thoughts.json) arrive once, when something in
 *   their days has changed: the first fish, the first night, a page from the
 *   last castaway, the hundredth fish. Together they are the story.
 * - Mind thoughts are the next goal, said out loud only when it is new and
 *   urgent, or when the player has spent a while not getting to it.
 *
 * Checked after every action, after lessons; at most one per action, spaced
 * a few casts apart so they never pile up.
 */
import type { Content } from '../content/assemble';
import type { Thought } from '../content/schema';
import { type Ctx, type GameEvent, log, speciesCaught, sunAt } from './actions';
import { nextGoal } from './goals';
import { holds } from './lessons';
import type { GameState } from './state';

/** Count a new local day, so "day 3" means the third day the player has lived on the island. */
export function tickDay(s: GameState, ctx: Ctx): void {
  const key = sunAt(ctx, s.locationId).local.dayKey;
  if (s.days.key === key) return;
  s.days = { key, n: s.days.n + 1 };
}

function ready(th: Thought, s: GameState, ctx: Ctx): boolean {
  if (s.thoughts.includes(th.id)) return false;
  if (ctx.content.locations[s.locationId]?.regionId !== th.regionId) return false;
  return th.when.some((group) => group.every((c) => holds(c, s, ctx)));
}

export function fillThought(line: string, s: GameState, content: Content): string {
  return line
    .replace('{days}', s.days.n <= 1 ? 'a day' : `${s.days.n} days`)
    .replace('{catches}', String(s.stats.catches))
    .replace('{kinds}', String(speciesCaught(s, content)));
}

/**
 * At most one thought for this action. `taught` is true when a lesson card
 * has just gone up: no thought then, and the lesson's own "Now" counts as
 * having said the next goal.
 */
export function checkThoughts(s: GameState, ctx: Ctx, taught = false): GameEvent[] {
  tickDay(s, ctx);
  const b = ctx.content.balance.thoughts;
  const goal = nextGoal(s, ctx.content);
  if (goal && s.mind?.key !== goal.key) s.mind = { key: goal.key, at: s.stats.casts, shown: 0, last: -1 };
  if (!goal) s.mind = null;
  if (taught) {
    if (s.mind) s.mind = { ...s.mind, shown: Math.max(1, s.mind.shown), last: s.stats.casts };
    return [];
  }
  const sinceAny = s.stats.casts - Math.max(s.counts.castsAtThought ?? -999, s.counts.castsAtLesson ?? -999);
  const spaced = sinceAny >= b.gapCasts;

  const th = ctx.content.thoughts.find((x) => ready(x, s, ctx) && (!x.gap || spaced));
  if (th) {
    s.thoughts.push(th.id);
    s.counts.castsAtThought = s.stats.casts;
    const lines = th.lines.map((l) => fillThought(l, s, ctx.content));
    log(s, ctx, 'thought', lines.join(' '));
    return [{ type: 'thought', thoughtId: th.id, lines }];
  }

  const m = s.mind;
  if (!goal || !m || goal.nudge == null || !spaced) return [];
  const due = m.shown === 0 ? s.stats.casts - m.at >= goal.nudge : m.shown <= b.repeats && s.stats.casts - m.last >= b.repeatCasts;
  if (!due) return [];
  m.shown++;
  m.last = s.stats.casts;
  s.counts.castsAtThought = s.stats.casts;
  return [{ type: 'thought', lines: [goal.text], mind: true }];
}

/**
 * Saves from before thoughts existed: everything that would already have
 * been thought counts as thought, so a returning player is not flooded.
 */
export function syncThoughts(s: GameState, ctx: Ctx): void {
  if (!s.flags.syncThoughts) return;
  delete s.flags.syncThoughts;
  tickDay(s, ctx);
  for (const th of ctx.content.thoughts) {
    if (!s.thoughts.includes(th.id) && th.when.some((g) => g.every((c) => holds(c, s, ctx)))) s.thoughts.push(th.id);
  }
}
