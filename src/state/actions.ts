/**
 * Reducers. Each takes a draft GameState (already cloned by the store), a
 * context carrying content and the clock, and returns events for the UI.
 * No browser APIs here: this file runs in Node for tests and the simulator.
 */
import type { Content } from '../content/assemble';
import type { GatherNode, Hotspot, Item, Location, Phase } from '../content/schema';
import {
  type Bite, type CatchCtx, type FishBite, type Grade, type Rig, type WaitPlan,
  type Cruiser, type SightReaction,
  baitType, candidatePool, fishValue, formatLength, legendaryActive, legendaryBite, planWait, resolveBite, resolveHandCatch, sightReaction, sizeClass,
} from '../sim/catch';
import { type Rng, chance, makeRng, weighted } from '../sim/rng';
import { type SunInfo, moonIndex, sunInfo } from '../sim/time';
import { craftCheck, nodeOpen, pickProvisions, recipeView, refreshNode, resolveTrap, soakPhases, tablePick } from '../sim/world';
import { teach } from './lessons';
import type { GameState, GuideEntry, JournalKind, KeptFish } from './state';

export interface Ctx {
  content: Content;
  /** Epoch ms from the injectable clock. */
  now: number;
  deviceTz: string;
}

export interface Reveal {
  speciesId: string;
  lengthCm: number;
  weightG: number;
  grade: Grade;
  isNew: boolean;
  isPB: boolean;
  releaseOnly: boolean;
  source: 'rod' | 'hand' | 'trap';
  locationId: string;
  legendaryId?: string;
  /** Bait creatures go straight into the bag. */
  bagged?: { item: string; qty: number };
  value: number;
}

export type GameEvent =
  | { type: 'toast'; text: string; glyph?: string; tone?: 'good' | 'warn' | 'info' }
  | { type: 'gain'; itemId: string; qty: number }
  | { type: 'page'; pageId: string; lessonId?: string; seen?: string }
  | { type: 'reveal'; reveal: Reveal }
  | { type: 'sfx'; id: string }
  | { type: 'haul'; reveals: Reveal[]; soakH: number }
  | { type: 'lesson'; lessonId: string; seen: string }
  | { type: 'thought'; lines: string[]; thoughtId?: string; mind?: boolean }
  | { type: 'ending' };

const toast = (text: string, glyph?: string, tone: 'good' | 'warn' | 'info' = 'info'): GameEvent => ({ type: 'toast', text, glyph, tone });

// ---------- helpers ----------

export function sunAt(ctx: Ctx, locationId: string): SunInfo {
  const loc = ctx.content.locations[locationId];
  return sunInfo(ctx.now, loc, ctx.deviceTz, ctx.content.balance);
}

export function withRng<T>(s: GameState, fn: (rng: Rng) => T): T {
  const rng = makeRng(s.rng);
  const out = fn(rng);
  s.rng = rng.state();
  return out;
}

export const has = (s: GameState, itemId: string): boolean => (s.inventory[itemId] ?? 0) > 0;

/** Count an event that a lesson may be waiting for. */
export function countEvent(s: GameState, key: string, n = 1): void {
  s.counts[key] = (s.counts[key] ?? 0) + n;
}

export function addItem(s: GameState, itemId: string, qty = 1): void {
  s.inventory[itemId] = (s.inventory[itemId] ?? 0) + qty;
  s.everHeld[itemId] = true;
}

export function takeItem(s: GameState, itemId: string, qty = 1): boolean {
  if ((s.inventory[itemId] ?? 0) < qty) return false;
  s.inventory[itemId] -= qty;
  if (s.inventory[itemId] <= 0) delete s.inventory[itemId];
  return true;
}

export function log(s: GameState, ctx: Ctx, kind: JournalKind, text: string, extra: { speciesId?: string; locationId?: string } = {}): void {
  s.journal.push({ id: s.nextJournalId++, at: ctx.now, kind, text, locationId: extra.locationId ?? s.locationId, speciesId: extra.speciesId });
  if (s.journal.length > 400) {
    const drop = s.journal.findIndex((e) => !e.pinned && e.kind !== 'page' && e.kind !== 'story');
    if (drop >= 0) s.journal.splice(drop, 1);
  }
}

function entry(s: GameState, speciesId: string): GuideEntry {
  return (s.guide[speciesId] ??= { state: 'rumoured', count: 0, released: 0, cells: {}, rumours: [] });
}

export function speciesCaught(s: GameState, content: Content): number {
  return Object.entries(s.guide).filter(([id, e]) => e.state === 'caught' && content.species[id]?.kind !== 'sighting').length;
}

/** Kinds of fish caught: not crabs picked up for bait, lobster from a trap or animals only seen. */
export function fishKinds(s: GameState, content: Content): number {
  return Object.entries(s.guide).filter(([id, e]) => e.state === 'caught' && content.species[id]?.kind === 'fish').length;
}

export type Here = 'caught' | 'seen' | 'told';

/** What the guide knows of an animal at one place: caught there, seen there, told it lives there, or nothing. */
export function placeState(e: GuideEntry | undefined, locationId: string): Here | null {
  if (!e) return null;
  let told = false;
  for (const [k, v] of Object.entries(e.cells)) {
    if (k.startsWith(`zone:${locationId}/`)) {
      if (v === 'c') return 'caught';
      told = true;
    }
  }
  if (e.cells[`at:${locationId}`]) return 'caught';
  if (e.cells[`seen:${locationId}`]) return 'seen';
  return told ? 'told' : null;
}

/** Evaluate a hotspot condition such as "flag:hasRod", "has:torch" or "everHeld:woven-trap". */
export function cond(s: GameState, expr: string | undefined): boolean {
  if (!expr) return true;
  const neg = expr.startsWith('!');
  const [kind, val] = (neg ? expr.slice(1) : expr).split(':');
  const v = kind === 'flag' ? !!s.flags[val] : kind === 'has' ? has(s, val) : kind === 'everHeld' ? !!s.everHeld[val] : kind === 'quest' ? s.quests[val]?.state === 'done'
    : kind === 'know' ? s.lessons.includes(val) : kind === 'recipe' ? s.recipesKnown.includes(val) : false;
  return neg ? !v : v;
}

export function hotspotVisible(s: GameState, h: Hotspot): boolean {
  return cond(s, h.showIf) && !(h.hideIf && cond(s, h.hideIf));
}

/** The rig as items, or null without a rod and line. */
export function rigOf(s: GameState, content: Content): Rig | null {
  const g = (id: string | null): Item | null => (id && has(s, id) ? content.items[id] ?? null : null);
  const rod = g(s.rig.rod);
  const line = g(s.rig.line);
  if (!rod || !line) return null;
  return { rod, line, reel: g(s.rig.reel), hook: g(s.rig.hook), bait: g(s.rig.bait), lure: g(s.rig.lure), float: g(s.rig.float), sinker: g(s.rig.sinker), method: s.rig.method };
}

/** Why the player cannot cast, in the castaway's words, or null when ready. */
export function rigProblem(s: GameState, content: Content): string | null {
  const rig = rigOf(s, content);
  if (!rig) return 'I have nothing to fish with.';
  if (rig.method === 'lure') return rig.lure ? null : 'No lure tied on. Open the rig to change it.';
  if (!rig.hook) return 'No hook. Two shells will grind into one.';
  if (!rig.bait) return 'No bait on the hook. The wet sand on the beach is full of sand fleas.';
  return null;
}

export function describeRig(rig: Rig): string {
  const parts = [rig.rod.name, rig.line.name];
  if (rig.method === 'lure') parts.push(rig.lure?.name ?? 'no lure');
  else parts.push(rig.hook?.name ?? 'no hook', rig.bait?.name ?? 'no bait');
  return parts.join(', ').toLowerCase();
}

export const isDark = (s: GameState, ctx: Ctx): boolean => sunAt(ctx, s.locationId).phase === 'night' && !has(s, 'torch') && !has(s, 'lantern');

/** Put a newly gained item on the rig when its slot is empty, or when it is a plain upgrade. */
function autoEquip(s: GameState, content: Content, itemId: string): void {
  const it = content.items[itemId];
  if (!it) return;
  const cur = (slot: keyof GameState['rig']) => (s.rig[slot] && has(s, s.rig[slot] as string) ? content.items[s.rig[slot] as string] : null);
  if (it.rod && (cur('rod')?.rod?.tier ?? -1) < it.rod.tier) s.rig.rod = itemId;
  if (it.line && (cur('line')?.line?.strength ?? -1) < it.line.strength) s.rig.line = itemId;
  if (it.reel && (cur('reel')?.reel?.greenBonus ?? -1) < it.reel.greenBonus) s.rig.reel = itemId;
  if (it.hook && !cur('hook')) s.rig.hook = itemId;
  if (it.bait && !cur('bait')) s.rig.bait = itemId;
  if (it.lure && !cur('lure')) s.rig.lure = itemId;
  if (it.float && !cur('float')) s.rig.float = itemId;
  if (it.sinker && !cur('sinker')) s.rig.sinker = itemId;
}

/** Drop rig slots whose item has run out, and reach for a spare of the same kind. */
function tidyRig(s: GameState, content: Content): void {
  const spare = (kind: Item['kind']) => Object.keys(s.inventory).find((id) => has(s, id) && content.items[id]?.kind === kind) ?? null;
  for (const slot of ['hook', 'bait', 'lure', 'float', 'sinker'] as const) {
    const id = s.rig[slot];
    if (id && !has(s, id)) s.rig[slot] = slot === 'bait' ? null : spare(slot);
  }
}

function gain(s: GameState, ctx: Ctx, itemId: string, qty: number, events: GameEvent[]): void {
  if (itemId === 'message-bottle') {
    events.push(...openBottle(s, ctx));
    return;
  }
  if (itemId === 'crate') {
    events.push(toast('A waterlogged crate. I prise it open.', '📦'));
    withRng(s, (rng) => {
      const table = ctx.content.junk['beach-wrack'].entries.filter((e) => e.item !== 'message-bottle');
      for (let i = 0; i < 3; i++) {
        const e = weighted(rng, table, (t) => t.weight);
        if (e) gain(s, ctx, e.item, 1, events);
      }
    });
    return;
  }
  addItem(s, itemId, qty);
  autoEquip(s, ctx.content, itemId);
  events.push({ type: 'gain', itemId, qty });
}

// ---------- travel and pickups ----------

export function travel(s: GameState, ctx: Ctx, locationId: string): GameEvent[] {
  const loc = ctx.content.locations[locationId];
  if (!loc) return [];
  s.locationId = locationId;
  if (!s.visited[locationId]) {
    s.visited[locationId] = true;
    log(s, ctx, 'travel', `${loc.name}. ${loc.blurb}`, { locationId });
  }
  for (const { quest, save } of activeQuests(s, ctx)) {
    if (quest.goal.type === 'visit' && quest.goal.locationId === locationId) {
      save.state = 'ready';
      log(s, ctx, 'quest', `“${quest.title}”: done. ${ctx.content.people[quest.personId].name} will want to hear.`);
    }
  }
  return [{ type: 'sfx', id: 'travel' }];
}

export function pickup(s: GameState, ctx: Ctx, ref: string): GameEvent[] {
  const events: GameEvent[] = [];
  if (ref === 'start-rod' && !s.flags.hasRod) {
    s.flags.hasRod = true;
    for (const id of ['old-rod', 'old-line', 'rusty-hook']) gain(s, ctx, id, 1, events);
    log(s, ctx, 'story', 'Found a fishing rod tangled in the wrack: cracked, salt-stiff, one rusty hook still on the line. It is the best thing I own. It is the only thing I own.');
    events.push(toast('An old rod, a length of line and one rusty hook.', '🎣', 'good'));
  }
  return events;
}

// ---------- gathering ----------

function nodeKey(locationId: string, hotspotId: string): string {
  return `${locationId}/${hotspotId}`;
}

export function nodeStatus(s: GameState, ctx: Ctx, loc: Location, h: Hotspot) {
  const def = h.node as GatherNode;
  const sun = sunAt(ctx, loc.id);
  const save = refreshNode(def, s.nodes[nodeKey(loc.id, h.id)], ctx.now, sun.local.dayKey);
  return { def, save, open: nodeOpen(def, sun.phase), needsTool: !!def.requiresTool && !has(s, def.requiresTool), sun };
}

export function gather(s: GameState, ctx: Ctx, hotspotId: string): GameEvent[] {
  const loc = ctx.content.locations[s.locationId];
  const h = loc?.scene.hotspots.find((x) => x.id === hotspotId);
  if (!loc || !h?.node) return [];
  const { def, save, open, needsTool, sun } = nodeStatus(s, ctx, loc, h);
  const key = nodeKey(loc.id, h.id);
  s.nodes[key] = save;
  if (needsTool) return [toast(`Too tough to take by hand. I need a ${ctx.content.items[def.requiresTool!].name.toLowerCase()}.`, '✋', 'warn')];
  if (!open) return [toast(def.phases?.includes('night') ? 'Nothing stirring. They come out when the light goes.' : 'Nothing here at this hour.', '🌗')];
  if (save.stock <= 0) return [toast('Picked clean for now. It will come back.', '⏳')];

  const events: GameEvent[] = [];
  const take = () => {
    const wasFull = save.stock >= def.max;
    s.nodes[key] = { ...save, stock: save.stock - 1, t: wasFull ? ctx.now : save.t };
  };

  if (def.handZone) {
    if (sun.phase === 'night' && isDark(s, ctx) && def.handZone !== 'swash') return [toast('Too dark to see what I am reaching for.', '🌑', 'warn')];
    const rig = rigOf(s, ctx.content) ?? bareHands(ctx.content);
    const cctx: CatchCtx = { content: ctx.content, locationId: loc.id, zoneId: def.handZone, phase: sun.phase, month: sun.local.month, rig, method: 'hand' };
    const reveal = withRng(s, (rng) => {
      const pickd = weighted(rng, candidatePool(cctx), (c) => c.weight);
      if (!pickd) return null;
      return recordCatch(s, ctx, resolveHandCatch(cctx, pickd.species.id, rng), def.handZone!, 'hand');
    });
    if (!reveal) return [toast('Nothing here right now.', '🌊')];
    take();
    if (reveal.bagged) {
      const bonus = has(s, 'bait-basket') ? 1 : 0;
      gain(s, ctx, reveal.bagged.item, reveal.bagged.qty + bonus, events);
      if (reveal.isNew) events.push({ type: 'reveal', reveal });
    } else events.push({ type: 'reveal', reveal });
    return events;
  }

  let itemId = def.item ?? null;
  if (def.table) {
    const nth = def.max - save.stock;
    itemId = tablePick(def, s.seed, `${key}@${save.day ?? ''}`, nth);
  }
  if (!itemId) return [];
  take();
  const item = ctx.content.items[itemId];
  const bonus = item?.kind === 'bait' && has(s, 'bait-basket') ? 1 : 0;
  gain(s, ctx, itemId, 1 + bonus, events);
  return events;
}

function bareHands(content: Content): Rig {
  const none = Object.values(content.items).find((i) => i.rod && i.rod.tier === 0)!;
  const line = Object.values(content.items).find((i) => i.line)!;
  return { rod: none, line, reel: null, hook: null, bait: null, lure: null, float: null, sinker: null, method: 'bait' };
}

// ---------- bottles, pages, rumours ----------

export function applyRumour(s: GameState, ctx: Ctx, rumourId: string): void {
  const r = ctx.content.rumours[rumourId];
  if (!r) return;
  const e = entry(s, r.speciesId);
  if (e.rumours.includes(rumourId)) return;
  e.rumours.push(rumourId);
  for (const cell of r.fillsCells) if (!e.cells[cell]) e.cells[cell] = 'r';
  const sp = ctx.content.species[r.speciesId];
  const who = e.state === 'caught' ? sp.commonName : 'A fish I have not caught';
  log(s, ctx, 'rumour', `${who}: “${r.text}” (${r.source})`, { speciesId: r.speciesId });
}

/**
 * A bottle on the line. When a lesson is waiting on the other castaway's
 * page, this is it: the page teaches the lesson. Otherwise it is just glass.
 */
export function openBottle(s: GameState, ctx: Ctx): GameEvent[] {
  s.stats.castsSinceBottle = 0;
  const lesson = s.stage ? ctx.content.lessons.find((l) => l.id === s.stage!.lesson) : null;
  const page = lesson?.via ? ctx.content.pages.find((p) => p.id === lesson.via) : null;
  if (!lesson || !page || s.lessons.includes(lesson.id)) {
    s.stage = null;
    addItem(s, 'sea-glass', 1);
    return [toast('An empty bottle, worn frosty by the sand. The glass is a pretty green.', '🍾'), { type: 'gain', itemId: 'sea-glass', qty: 1 }];
  }
  const seen = s.stage!.seen;
  s.stage = null;
  s.pagesFound = Math.max(s.pagesFound + 1, page.order);
  log(s, ctx, 'page', `${page.title}. ${page.text}`);
  for (const r of page.rumours) applyRumour(s, ctx, r);
  teach(s, ctx, lesson, seen);
  if (page.bearing) log(s, ctx, 'story', 'A bearing. West-south-west, two days. There is somewhere to go.');
  return [{ type: 'page', pageId: page.id, lessonId: lesson.id, seen }];
}

// ---------- fishing ----------

export function catchCtx(s: GameState, ctx: Ctx, zoneId: string, method: CatchCtx['method']): CatchCtx | null {
  const rig = rigOf(s, ctx.content);
  if (!rig) return null;
  const sun = sunAt(ctx, s.locationId);
  return {
    content: ctx.content, locationId: s.locationId, zoneId, phase: sun.phase, month: sun.local.month, rig, method,
    dark: isDark(s, ctx), moon: moonIndex(ctx.now),
  };
}

/** The line is in the water. Returns how long until something happens. */
export function beginCast(s: GameState, ctx: Ctx, zoneId: string, power = 0.5): WaitPlan | null {
  const c = catchCtx(s, ctx, zoneId, s.rig.method);
  if (!c) return null;
  s.stats.casts++;
  countEvent(s, `cast:${s.locationId}/${zoneId}`);
  if (power >= 0.92) countEvent(s, 'longCast');
  if (c.phase === 'dusk' || c.phase === 'night') countEvent(s, 'darkCast');
  if (c.phase === 'night') countEvent(s, 'nightCast');
  s.stats.castsSinceBottle++;
  s.zonesSeen[`${s.locationId}/${zoneId}`] = true;
  const plan = withRng(s, (rng) => planWait(c, rng));
  // A page is waiting: this cast brings it in, without keeping anyone waiting.
  if (s.stage) return { ...plan, active: true, waitS: Math.min(plan.waitS, 3), nibbles: 0 };
  // The very first fish comes quickly, after a nibble or two, so the player learns the rhythm.
  if (s.stats.catches === 0 && plan.active) return { ...plan, waitS: Math.min(plan.waitS, 3 + 2 * (s.stats.casts - 1)), nibbles: Math.max(1, plan.nibbles) };
  return plan;
}

/** Something takes the bait (or does not). */
export function rollBite(s: GameState, ctx: Ctx, zoneId: string): Bite {
  const c = catchCtx(s, ctx, zoneId, s.rig.method);
  if (!c) return { kind: 'none' };
  const b = ctx.content.balance;
  return withRng(s, (rng): Bite => {
    for (const leg of Object.values(ctx.content.legendaries)) {
      if (s.legendariesCaught.includes(leg.id)) continue;
      if (legendaryActive(leg, c) && chance(rng, leg.spawn.chancePerCast || b.legendaryChance)) return legendaryBite(leg, c);
    }
    if (s.stage) return { kind: 'junk', itemId: 'message-bottle' };
    let bite = resolveBite(c, rng);
    // Until the first catch, the water is kind: a fish, small enough to land, with time to strike.
    for (let i = 0; i < 8 && s.stats.catches === 0 && !(bite.kind === 'fish' && bite.outcome !== 'overmatched'); i++) bite = resolveBite(c, rng);
    if (s.stats.catches === 0 && bite.kind === 'fish') bite = { ...bite, hookWindowS: Math.max(2.2, bite.hookWindowS * 1.8) };
    return bite;
  });
}

/** A sighted fish has reached the bait. Does it eat? */
export function reactToBait(s: GameState, ctx: Ctx, zoneId: string, fish: Cruiser): SightReaction {
  const c = catchCtx(s, ctx, zoneId, 'sight');
  if (!c) return { kind: 'refuse', reason: 'bait' };
  s.zonesSeen[`${s.locationId}/${zoneId}`] = true;
  return withRng(s, (rng) => sightReaction(c, fish, rng));
}

export function useBait(s: GameState, ctx: Ctx): void {
  if (s.rig.method === 'bait' && s.rig.bait) {
    takeItem(s, s.rig.bait);
    tidyRig(s, ctx.content);
  }
}

/** Record a landed animal in the guide and journal. Does not decide keep or release. */
export function recordCatch(s: GameState, ctx: Ctx, bite: FishBite, zoneId: string, source: Reveal['source'], phaseOverride?: Phase): Reveal {
  const sp = ctx.content.species[bite.speciesId];
  const sun = sunAt(ctx, s.locationId);
  const phase = phaseOverride ?? sun.phase;
  const e = entry(s, sp.id);
  const isNew = e.state !== 'caught';
  if (isNew && sp.kind === 'fish') countEvent(s, 'newKind');
  e.state = 'caught';
  e.count++;
  e.firstAt ??= ctx.now;
  e.cells[`phase:${phase}`] = 'c';
  e.cells[`month:${sun.local.month}`] = 'c';
  e.cells[`zone:${s.locationId}/${zoneId}`] = 'c';
  s.zonesSeen[`${s.locationId}/${zoneId}`] = true;
  if (s.today.day !== sun.local.dayKey) s.today = { day: sun.local.dayKey, ids: [] };
  if (!s.today.ids.includes(sp.id)) s.today.ids.push(sp.id);
  if (['albula-vulpes', 'trachinotus-falcatus', 'megalops-atlanticus'].every((id) => s.today.ids.includes(id))) s.flags['badge:slam'] = true;
  const rig = rigOf(s, ctx.content);
  const bt = source === 'rod' ? (rig ? baitType(rig) : null) : source;
  if (bt) e.cells[`bait:${bt}`] = 'c';
  const isPB = !e.pb || bite.lengthCm > e.pb.lengthCm;
  if (isPB) {
    e.pb = {
      lengthCm: bite.lengthCm, weightG: bite.weightG, at: ctx.now, locationId: s.locationId,
      rig: source === 'rod' && rig ? describeRig(rig) : source === 'trap' ? 'woven trap' : 'by hand',
    };
  }
  if (!sp.gathersAs) s.stats.catches++;
  const loc = ctx.content.locations[s.locationId];
  const size = sp.lengthWeight ? `, ${formatLength(bite.lengthCm)}` : '';
  if (bite.legendaryId) {
    const leg = ctx.content.legendaries[bite.legendaryId];
    s.legendariesCaught.push(leg.id);
    log(s, ctx, 'catch', `${leg.name}. ${formatLength(bite.lengthCm)} of ${sp.commonName.toLowerCase()}. I will not see its like again.`, { speciesId: sp.id });
  } else if (isNew) {
    log(s, ctx, 'catch', `First ${sp.commonName.toLowerCase()}${size}, ${source === 'trap' ? 'from the trap' : source === 'hand' ? 'taken by hand' : `at ${loc.name}`} at ${phase}.`, { speciesId: sp.id });
  } else if (isPB && (bite.grade === 'large' || bite.grade === 'trophy' || bite.grade === 'record')) {
    log(s, ctx, 'pb', `New best ${sp.commonName.toLowerCase()}: ${formatLength(bite.lengthCm)}${bite.grade !== 'large' ? `, a ${bite.grade}` : ''}.`, { speciesId: sp.id });
  }
  onCatchQuests(s, ctx, bite, phase);
  return {
    speciesId: sp.id, lengthCm: bite.lengthCm, weightG: bite.weightG, grade: bite.grade, isNew, isPB: isPB && !isNew,
    releaseOnly: sp.conservation.releaseOnly, source, locationId: s.locationId, legendaryId: bite.legendaryId,
    bagged: sp.gathersAs, value: fishValue(sp, bite.grade, ctx.content.balance),
  };
}

/** A fish is in hand after a cast. */
export function landFish(s: GameState, ctx: Ctx, bite: FishBite, zoneId: string): Reveal {
  useBait(s, ctx);
  const r = recordCatch(s, ctx, bite, zoneId, 'rod');
  // The ship's rusty hook gives out on the fifth fish: the first thing the castaway has to work out.
  if (s.rig.hook === 'rusty-hook' && s.stats.catches >= 5 && !s.lessons.includes('hooks')) {
    takeItem(s, 'rusty-hook');
    tidyRig(s, ctx.content);
  }
  return r;
}

export type LossReason = 'snapped' | 'pulled' | 'spooled' | 'missed';

/** The one that got away. */
export function loseFish(s: GameState, ctx: Ctx, bite: FishBite, zoneId: string, reason: LossReason): GameEvent[] {
  const events: GameEvent[] = [];
  const sp = ctx.content.species[bite.speciesId];
  const loc = ctx.content.locations[s.locationId];
  const zone = loc.zones.find((z) => z.id === zoneId);
  const sun = sunAt(ctx, s.locationId);
  if (reason === 'missed') {
    countEvent(s, 'missed');
    if (s.rig.method === 'bait' && !withRng(s, (rng) => chance(rng, ctx.content.balance.bite.missKeepBaitChance))) {
      useBait(s, ctx);
      events.push(toast('Missed it. The bait is gone.', '💨', 'warn'));
    } else events.push(toast('Missed it.', '💨', 'warn'));
    return events;
  }
  s.stats.lost++;
  useBait(s, ctx);
  if (reason === 'snapped' || reason === 'spooled') {
    countEvent(s, 'snapped');
    const lost = s.rig.method === 'lure' ? s.rig.lure : s.rig.hook;
    if (lost) {
      takeItem(s, lost);
      tidyRig(s, ctx.content);
      events.push(toast(`The line parted. Lost the ${ctx.content.items[lost].name.toLowerCase()}.`, '💥', 'warn'));
    }
  } else {
    countEvent(s, 'pulled');
    events.push(toast('The hook pulled free.', '🪝', 'warn'));
  }
  const e = entry(s, sp.id);
  if (e.state === 'rumoured') e.state = 'sighted';
  if (bite.legendaryId) {
    const leg = ctx.content.legendaries[bite.legendaryId];
    log(s, ctx, 'clue', `${leg.name}. I had him on, ${sizeClass(bite.lengthCm)} beyond anything, and then I did not. He is still out there.`, { speciesId: sp.id });
  } else if (bite.outcome !== 'auto') {
    const how = reason === 'snapped' ? 'broke the line' : reason === 'spooled' ? 'took every yard of line I had and kept going' : 'threw the hook';
    const over = bite.outcome === 'overmatched' ? ' I could do nothing with it. Not with this gear.' : '';
    log(s, ctx, 'away', `Something ${sizeClass(bite.lengthCm)} took the ${s.rig.method === 'lure' ? 'lure' : 'bait'} in the ${zone?.name.toLowerCase() ?? 'water'} at ${sun.phase} and ${how}.${over}`, { speciesId: sp.id });
  }
  return events;
}

export function stolenBait(s: GameState, ctx: Ctx): GameEvent[] {
  countEvent(s, 'stolen');
  useBait(s, ctx);
  return [toast('Something small stripped the hook. Too small for this hook to catch.', '🐟', 'warn')];
}

export function landJunk(s: GameState, ctx: Ctx, itemId: string): GameEvent[] {
  const events: GameEvent[] = [];
  const it = ctx.content.items[itemId];
  if (itemId !== 'message-bottle' && itemId !== 'crate') events.push(toast(`Not a fish: ${it?.name.toLowerCase() ?? itemId}.`, it?.glyph));
  gain(s, ctx, itemId, 1, events);
  return events;
}

/** A silhouette the player has noticed. Sighting-only animals are fully recorded by seeing them. */
export function sighting(s: GameState, ctx: Ctx, speciesId: string): GameEvent[] {
  const sp = ctx.content.species[speciesId];
  if (!sp) return [];
  const e = entry(s, speciesId);
  // Where it was seen, so the guide shows it under this place and no other.
  e.cells[`${sp.kind === 'sighting' ? 'at' : 'seen'}:${s.locationId}`] = 'c';
  if (sp.kind === 'sighting') {
    const isNew = e.state !== 'caught';
    e.state = 'caught';
    e.count++;
    e.firstAt ??= ctx.now;
    const sun = sunAt(ctx, s.locationId);
    e.cells[`phase:${sun.phase}`] = 'c';
    e.cells[`month:${sun.local.month}`] = 'c';
    if (isNew) {
      log(s, ctx, 'sighting', `Saw a ${sp.commonName.toLowerCase()} at ${ctx.content.locations[s.locationId].name}.`, { speciesId });
      return [toast(`${sp.commonName}. Noted in the field guide.`, '👁', 'good'), { type: 'sfx', id: 'discover' }];
    }
    return [toast(sp.commonName, '👁')];
  }
  if (e.state === 'caught') return [toast(sp.commonName, '👁')];
  if (e.state !== 'sighted') {
    e.state = 'sighted';
    log(s, ctx, 'sighting', `A shape in the water at ${ctx.content.locations[s.locationId].name} that I do not know. Sketched it.`, { speciesId });
    return [toast('A shape I do not know. Sketched it in the field guide.', '👁', 'good'), { type: 'sfx', id: 'discover' }];
  }
  return [toast('That shape again. Still no name for it.', '👁')];
}

/** A sighted fish looked at the bait and left. The reason is a clue. */
export function refusal(s: GameState, ctx: Ctx, speciesId: string, reason: 'bait' | 'small-hook'): GameEvent[] {
  const key = `refused:${speciesId}:${reason}:${s.rig.method === 'lure' ? s.rig.lure : s.rig.bait}`;
  const text = reason === 'small-hook' ? 'It mouthed the bait and dropped it. The hook is too big for that one.' : 'It looked, and turned away. It wants something else.';
  if (!s.flags[key]) {
    s.flags[key] = true;
    const e = entry(s, speciesId);
    if (e.state === 'rumoured') e.state = 'sighted';
    log(s, ctx, 'sighting', `A fish at ${ctx.content.locations[s.locationId].name} came to the ${s.rig.method === 'lure' ? 'lure' : 'bait'}, looked, and turned away. It wants something I am not offering.`, { speciesId });
  }
  return [toast(text, '🙄', 'warn')];
}

// ---------- the catch, once landed ----------

export function keepFish(s: GameState, ctx: Ctx, r: Reveal): GameEvent[] {
  const sp = ctx.content.species[r.speciesId];
  if (sp.conservation.releaseOnly) return releaseFish(s, ctx, r);
  if (s.creel.length >= creelLimit(s, ctx.content)) {
    countEvent(s, 'creelFull');
    return [toast('The basket is full. Release it, or make room at camp.', '🧺', 'warn')];
  }
  s.creel.push({ uid: s.nextUid++, speciesId: r.speciesId, lengthCm: r.lengthCm, weightG: r.weightG, grade: r.grade, at: ctx.now, locationId: r.locationId });
  countEvent(s, 'kept');
  return [{ type: 'sfx', id: 'keep' }];
}

export function creelLimit(s: GameState, content: Content): number {
  return content.balance.creelLimit + (has(s, 'cooler') ? 12 : 0);
}

export function releaseFish(s: GameState, ctx: Ctx, r: Reveal): GameEvent[] {
  entry(s, r.speciesId).released++;
  onReleaseQuests(s, ctx, r);
  const events: GameEvent[] = [{ type: 'sfx', id: 'release' }];
  const sp = ctx.content.species[r.speciesId];
  if (sp.conservation.releaseOnly && sp.kind !== 'sighting' && has(s, 'tag-kit')) {
    const pay = Math.round(ctx.content.balance.economy.tagPayment * (1 + r.lengthCm / 100));
    s.coins += pay;
    s.stats.coinsEarned += pay;
    s.stats.tagged++;
    log(s, ctx, 'catch', `Tagged and released a ${sp.commonName.toLowerCase()}, ${formatLength(r.lengthCm)}. Dr Reyes pays ${pay} coins for the record.`, { speciesId: sp.id });
    events.push(toast(`Tagged and released. +${pay} coins for the data.`, '🏷️', 'good'), { type: 'sfx', id: 'coin' });
  }
  return events;
}

/** Learn one condition of a legendary's spawn rule. */
export function grantClue(s: GameState, ctx: Ctx, clueId: string): boolean {
  if (s.clues.includes(clueId)) return false;
  const [lid, dim] = clueId.split(':');
  const leg = ctx.content.legendaries[lid];
  const clue = leg?.clues.find((c) => c.dimension === dim);
  if (!clue) return false;
  s.clues.push(clueId);
  log(s, ctx, 'clue', `${leg.name}: ${clue.text}`, { speciesId: leg.speciesId });
  return true;
}

export function fishToBait(s: GameState, ctx: Ctx, r: Reveal): GameEvent[] {
  if (!has(s, 'stone-knife') && !has(s, 'fillet-knife')) return [toast('I need a knife to cut bait.', '🔪', 'warn')];
  const events: GameEvent[] = [];
  countEvent(s, 'cleaned');
  gain(s, ctx, 'cut-bait', ctx.content.balance.camp.cleanBait, events);
  gain(s, ctx, 'fish-bone', ctx.content.balance.camp.cleanBones, events);
  return events;
}

// ---------- camp ----------

export function craft(s: GameState, ctx: Ctx, recipeId: string): GameEvent[] {
  const r = ctx.content.recipes[recipeId];
  if (!r) return [];
  if (recipeView(r, s.recipesKnown) !== 'known') return [toast('I do not know how to make that yet.', '✋', 'warn')];
  const events: GameEvent[] = [];
  if (r.special === 'provisions') {
    const p = ctx.content.balance.provisions;
    const picks = pickProvisions(s.larder, p.fish, p.species);
    if (!picks) return [toast(`Provisions need ${p.fish} smoked fish of at least ${p.species} kinds.`, '🍱', 'warn')];
    s.larder = s.larder.filter((_, i) => !picks.includes(i));
  } else {
    const check = craftCheck(r, s.inventory);
    if (!check.ok) return [toast('I do not have everything for that yet.', '✋', 'warn')];
    for (const i of r.inputs) takeItem(s, i.item, i.qty);
  }
  const first = !s.everHeld[r.output.item];
  gain(s, ctx, r.output.item, r.output.qty, events);
  tidyRig(s, ctx.content);
  const out = ctx.content.items[r.output.item];
  if (first && !['material', 'bait'].includes(out.kind)) log(s, ctx, 'craft', `Made a ${out.name.toLowerCase()}. ${out.desc}`);
  events.push({ type: 'sfx', id: 'craft' }, toast(`Made: ${out.name}${r.output.qty > 1 ? ` ×${r.output.qty}` : ''}`, out.glyph, 'good'));
  return events;
}

export function cleanFish(s: GameState, ctx: Ctx, uid: number): GameEvent[] {
  if (!has(s, 'stone-knife') && !has(s, 'fillet-knife')) return [toast('I need a knife to clean fish.', '🔪', 'warn')];
  const i = s.creel.findIndex((f) => f.uid === uid);
  if (i < 0) return [];
  s.creel.splice(i, 1);
  countEvent(s, 'cleaned');
  const events: GameEvent[] = [{ type: 'sfx', id: 'craft' }];
  gain(s, ctx, 'cut-bait', ctx.content.balance.camp.cleanBait, events);
  gain(s, ctx, 'fish-bone', ctx.content.balance.camp.cleanBones, events);
  return events;
}

export function releaseKept(s: GameState, _ctx: Ctx, uid: number): GameEvent[] {
  s.creel = s.creel.filter((f) => f.uid !== uid);
  return [toast('Slipped it back.', '🌊')];
}

export function rackAdd(s: GameState, ctx: Ctx, uid: number): GameEvent[] {
  if (!has(s, 'drying-rack')) return [toast('I need a drying rack over the fire.', '🪜', 'warn')];
  if (s.rack.length >= ctx.content.balance.camp.rackSlots) return [toast('The rack is full.', '🪜', 'warn')];
  const i = s.creel.findIndex((f) => f.uid === uid);
  if (i < 0) return [];
  const [fish] = s.creel.splice(i, 1);
  s.rack.push({ fish, startedAt: ctx.now });
  return [{ type: 'sfx', id: 'craft' }, toast('Split and hung over the smoke.', '🔥')];
}

export const rackReady = (slot: { startedAt: number }, ctx: Ctx): boolean => ctx.now - slot.startedAt >= ctx.content.balance.camp.smokeMin * 60_000;

export function rackCollect(s: GameState, ctx: Ctx): GameEvent[] {
  const done = s.rack.filter((r) => rackReady(r, ctx));
  if (!done.length) return [toast('Not ready. Smoke takes its time.', '⏳')];
  s.rack = s.rack.filter((r) => !rackReady(r, ctx));
  for (const r of done) s.larder.push({ ...r.fish, smoked: true });
  return [{ type: 'sfx', id: 'keep' }, toast(`${done.length} smoked fish into the larder.`, '🍱', 'good')];
}

// ---------- traps ----------

/** Where a trap sits at a location: the first zone anything can be trapped in. */
export function trapZone(content: Content, locationId: string): string | null {
  const occ = (content.occByLocation[locationId] ?? []).find((o) => o.methods.includes('trap'));
  return occ?.zones.find((z) => content.locations[locationId].zones.some((lz) => lz.id === z && lz.cast)) ?? occ?.zones[0] ?? null;
}

export function trapSet(s: GameState, ctx: Ctx, trapItemId: string, baitId: string | null): GameEvent[] {
  const zoneId = trapZone(ctx.content, s.locationId);
  if (!zoneId) return [toast('Nowhere to set a trap here.', '🪤', 'warn')];
  if (s.traps.some((t) => t.locationId === s.locationId)) return [toast('There is already a trap down here.', '🪤')];
  if (!takeItem(s, trapItemId)) return [toast('No trap to set.', '🪤', 'warn')];
  if (baitId && !takeItem(s, baitId)) baitId = null;
  tidyRig(s, ctx.content);
  s.traps.push({ locationId: s.locationId, zoneId, itemId: trapItemId, baitId, setAt: ctx.now });
  return [{ type: 'sfx', id: 'splash' }, toast(baitId ? 'Trap baited and sunk. Now to leave it alone.' : 'Trap sunk without bait. It may still catch something.', '🪤', 'good')];
}

export function trapPeek(s: GameState, ctx: Ctx) {
  const trap = s.traps.find((t) => t.locationId === s.locationId);
  if (!trap) return null;
  const def = ctx.content.items[trap.itemId].trap!;
  const soakH = (ctx.now - trap.setAt) / 3_600_000;
  return { trap, soakH, ready: soakH >= def.minSoakH, def };
}

export function trapHaul(s: GameState, ctx: Ctx): GameEvent[] {
  const i = s.traps.findIndex((t) => t.locationId === s.locationId);
  if (i < 0) return [];
  const trap = s.traps[i];
  const sun = sunAt(ctx, s.locationId);
  const rig = rigOf(s, ctx.content) ?? bareHands(ctx.content);
  const soakH = (ctx.now - trap.setAt) / 3_600_000;
  const haul = resolveTrap(trap, ctx.now, ctx.content, s.seed, soakPhases(soakH, sun.phase), sun.local.month, rig.rod, rig.line);
  s.traps.splice(i, 1);
  addItem(s, trap.itemId, 1);
  const events: GameEvent[] = [{ type: 'sfx', id: 'splash' }];
  if (!haul.ready) {
    if (trap.baitId) addItem(s, trap.baitId, 1);
    return [...events, toast('Pulled it early. Empty; it wants at least an hour.', '🪤')];
  }
  const reveals: Reveal[] = [];
  haul.catches.forEach((bite, k) => {
    const phases = soakPhases(soakH, sun.phase);
    const r = recordCatch(s, ctx, bite, trap.zoneId, 'trap', phases[k % phases.length]);
    reveals.push(r);
    if (r.releaseOnly) entry(s, r.speciesId).released++;
    else if (s.creel.length < creelLimit(s, ctx.content)) keepFish(s, ctx, r);
  });
  const names = reveals.map((r) => ctx.content.species[r.speciesId].commonName.toLowerCase());
  log(s, ctx, 'trap', names.length ? `Hauled the trap after ${Math.round(haul.soakH)} hours: ${names.join(', ')}.` : `Hauled the trap after ${Math.round(haul.soakH)} hours. Empty, and the bait gone.`);
  events.push({ type: 'haul', reveals, soakH: haul.soakH });
  return events;
}

// ---------- the raft ----------

export const RAFT_PARTS = ['raft-hull', 'raft-lashings', 'raft-mast', 'raft-sail', 'raft-oar', 'provisions'];

export function raftStatus(s: GameState) {
  const parts = RAFT_PARTS.map((id) => ({ id, done: has(s, id) }));
  return { parts, bearing: !!s.flags.bearing, ready: parts.every((p) => p.done) && !!s.flags.bearing };
}

export function launchRaft(s: GameState, ctx: Ctx): GameEvent[] {
  if (!raftStatus(s).ready) return [toast('The raft is not ready.', '⛵', 'warn')];
  for (const p of RAFT_PARTS) takeItem(s, p);
  s.flags.launched = true;
  addItem(s, 'raft', 1);
  log(s, ctx, 'story', 'Pushed the raft through the surf at slack water and did not look back until the island was a line of palms on the horizon. Then I looked back for a long time.');
  return [{ type: 'ending' }];
}

// ---------- journal and settings ----------

export function togglePin(s: GameState, _ctx: Ctx, entryId: number): GameEvent[] {
  const e = s.journal.find((j) => j.id === entryId);
  if (e) e.pinned = !e.pinned;
  return [];
}

export function setNote(s: GameState, _ctx: Ctx, locationId: string, text: string): GameEvent[] {
  if (text.trim()) s.notes[locationId] = text.slice(0, 600);
  else delete s.notes[locationId];
  return [];
}

export function equip(s: GameState, ctx: Ctx, slot: keyof Omit<GameState['rig'], 'method'>, itemId: string | null): GameEvent[] {
  if (itemId && !has(s, itemId)) return [];
  s.rig[slot] = itemId;
  if (slot === 'lure' && itemId) s.rig.method = 'lure';
  if ((slot === 'bait' || slot === 'hook') && itemId) s.rig.method = 'bait';
  tidyRig(s, ctx.content);
  return [{ type: 'sfx', id: 'tap' }];
}

export function setMethod(s: GameState, _ctx: Ctx, method: 'bait' | 'lure'): GameEvent[] {
  s.rig.method = method;
  return [{ type: 'sfx', id: 'tap' }];
}

// ---------- quests (first port onward) ----------

function activeQuests(s: GameState, ctx: Ctx) {
  return Object.entries(s.quests)
    .filter(([, q]) => q.state === 'active')
    .map(([id, save]) => ({ quest: ctx.content.quests[id], save }))
    .filter((q) => q.quest);
}

function bump(s: GameState, ctx: Ctx, questId: string, need: number): void {
  const save = s.quests[questId];
  save.progress++;
  if (save.progress >= need) {
    save.state = 'ready';
    const q = ctx.content.quests[questId];
    log(s, ctx, 'quest', `“${q.title}”: done. ${ctx.content.people[q.personId].name} will want to hear.`);
  }
}

function onCatchQuests(s: GameState, ctx: Ctx, bite: FishBite, phase: Phase): void {
  for (const { quest, save } of activeQuests(s, ctx)) {
    const g = quest.goal;
    if (g.type === 'catch') {
      if (g.speciesId !== bite.speciesId) continue;
      if (g.minCm && bite.lengthCm < g.minCm) continue;
      if (g.phase && g.phase !== phase) continue;
      if (g.locationId && g.locationId !== s.locationId) continue;
      bump(s, ctx, quest.id, g.count);
    } else if (g.type === 'catchAny') {
      if (g.locationId && g.locationId !== s.locationId) continue;
      if (g.phase && g.phase !== phase) continue;
      if (g.grade && !gradeAtLeast(bite.grade, g.grade as Grade)) continue;
      if (g.distinct) {
        save.seen ??= [];
        if (save.seen.includes(bite.speciesId)) continue;
        save.seen.push(bite.speciesId);
      }
      bump(s, ctx, quest.id, g.count);
    }
  }
}

const GRADE_ORDER: Grade[] = ['small', 'average', 'large', 'trophy', 'record'];
export const gradeAtLeast = (g: Grade, min: Grade): boolean => GRADE_ORDER.indexOf(g) >= GRADE_ORDER.indexOf(min);

function onReleaseQuests(s: GameState, ctx: Ctx, r: Reveal): void {
  for (const { quest } of activeQuests(s, ctx)) {
    const g = quest.goal;
    if (g.type === 'release' && g.speciesId === r.speciesId) bump(s, ctx, quest.id, g.count);
  }
}

export type { KeptFish };
