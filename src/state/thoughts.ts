/**
 * Thoughts: the castaway talking to themself, the moment something happens.
 *
 * - Story thoughts (content/thoughts.json) each follow one event: picking up
 *   the rod, the first fish, a hook of their own making, nightfall, a new
 *   morning, a page from the other castaway, the hundredth fish. Had once,
 *   straight away.
 * - The next goal is said out loud only when something prompts it: the last
 *   part for a recipe comes to hand ("I have everything for…"), a raft part
 *   is finished, or the castaway arrives where a missing part is.
 *
 * Nothing here runs on a timer or a count of casts.
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
 * The thought this action gives rise to, if any. `taught` is true when a
 * lesson has just been learned: its card already says what to do next.
 */
export function checkThoughts(s: GameState, ctx: Ctx, taught = false): GameEvent[] {
  tickDay(s, ctx);
  const m = (s.mind = { loc: s.mind?.loc ?? s.locationId, said: Array.isArray(s.mind?.said) ? s.mind.said : [] });
  const prevLoc = m.loc;
  m.loc = s.locationId;
  const goal = nextGoal(s, ctx.content);
  const say = (key: string) => {
    if (!m.said.includes(key)) m.said = [...m.said.slice(-60), key];
  };
  // A lesson card or page has just said what to do next.
  if (taught && goal) say(goal.key);

  const th = ctx.content.thoughts.find((x) => ready(x, s, ctx));
  if (th) {
    s.thoughts.push(th.id);
    if (goal?.nudge === 'now') say(goal.key);
    const lines = th.lines.map((l) => fillThought(l, s, ctx.content));
    log(s, ctx, 'thought', lines.join(' '));
    return [{ type: 'thought', thoughtId: th.id, lines }];
  }

  if (!goal || m.said.includes(goal.key)) return [];
  const arrived = goal.nudge === 'arrive' && goal.where === s.locationId && prevLoc !== s.locationId;
  if (!arrived && goal.nudge !== 'now') return [];
  say(goal.key);
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
