/**
 * The catch model (spec section 5). One weighted draw over the species that
 * could plausibly be at this spot, in this zone, at this real time, for this rig.
 */
import type { Content } from '../content/assemble';
import type { Balance, Item, Legendary, Method, Occurrence, Phase, Species } from '../content/schema';
import { type Rng, chance, clamp, lerp, normCdf, normal, range, weighted } from './rng';

export interface Rig {
  rod: Item;
  line: Item;
  reel: Item | null;
  hook: Item | null;
  bait: Item | null;
  lure: Item | null;
  float: Item | null;
  sinker: Item | null;
  /** What is tied on: bait under a float, or a lure. */
  method: 'bait' | 'lure';
}

export type Grade = 'small' | 'average' | 'large' | 'trophy' | 'record';

export interface CatchCtx {
  content: Content;
  locationId: string;
  zoneId: string;
  phase: Phase;
  /** 0 = January, in the location's calendar. */
  month: number;
  rig: Rig;
  method: Method;
  /** Night without a light: the float is hard to read. */
  dark?: boolean;
  /** Moon index 0..7, reserved for M4 conditions. */
  moon?: number;
}

export interface Candidate {
  occ: Occurrence;
  species: Species;
  weight: number;
  affinity: number;
}

export interface FishBite {
  kind: 'fish';
  speciesId: string;
  lengthCm: number;
  weightG: number;
  grade: Grade;
  percentile: number;
  /** Fish pull divided by rig power. */
  ratio: number;
  outcome: 'auto' | 'fight' | 'overmatched';
  hookWindowS: number;
  legendaryId?: string;
}

export type Bite =
  | FishBite
  | { kind: 'none' } // nothing in the pool wants this rig here and now
  | { kind: 'nibble' } // something big looked and left
  | { kind: 'stolen'; speciesId: string } // a fish too small for the hook took the bait
  | { kind: 'junk'; itemId: string };

export const rigPower = (rig: Rig): number => Math.min(rig.rod.rod?.power ?? 0, rig.line.line?.strength ?? 0);

export const castRange = (rig: Rig): number => (rig.rod.rod?.range ?? 0) + (rig.sinker?.sinker?.rangeBonus ?? 0);

/** Affinity keys offered by whatever is on the end of the line. */
export function terminalTags(rig: Rig): string[] {
  if (rig.method === 'lure') return rig.lure?.lure ? [rig.lure.lure.type] : [];
  return rig.bait?.bait?.tags ?? [];
}

/** The bait type recorded in the field guide grid. */
export function baitType(rig: Rig): string | null {
  return terminalTags(rig)[0] ?? null;
}

export function sizeShift(rig: Rig): number {
  const terminal = rig.method === 'lure' ? rig.lure?.lure?.sizeShift ?? 0 : rig.bait?.bait?.sizeShift ?? 0;
  return (rig.hook?.hook?.sizeShift ?? 0) + terminal;
}

function affinityFor(occ: Occurrence, ctx: CatchCtx): number {
  const tags = terminalTags(ctx.rig);
  const best = tags.reduce((m, t) => Math.max(m, occ.affinity[t] ?? 0), 0);
  switch (ctx.method) {
    case 'bait':
    case 'lure':
    case 'sight':
      return best;
    case 'trap':
    case 'net':
      return (occ.affinity[ctx.method] ?? 1) * (tags.length ? Math.max(0.5, best) : 0.5);
    case 'hand':
      return 1;
  }
}

/** Presence weight: is the species here now, regardless of what the player offers? */
export function presenceWeight(occ: Occurrence, ctx: Pick<CatchCtx, 'content' | 'phase' | 'month'>): number {
  return ctx.content.balance.rarityWeights[occ.rarity] * occ.phaseMod[ctx.phase] * (occ.monthMod[ctx.month] ?? 1);
}

/** Step 1 and 2: build the pool and weight it. */
export function candidatePool(ctx: CatchCtx): Candidate[] {
  const out: Candidate[] = [];
  const tier = ctx.rig.rod.rod?.tier ?? 0;
  for (const occ of ctx.content.occByLocation[ctx.locationId] ?? []) {
    if (!occ.zones.includes(ctx.zoneId)) continue;
    if (!occ.methods.includes(ctx.method)) continue;
    if (occ.minGear?.rodTier != null && tier < occ.minGear.rodTier) continue;
    const species = ctx.content.species[occ.speciesId];
    if (!species) continue;
    const affinity = affinityFor(occ, ctx);
    let weight = presenceWeight(occ, ctx) * affinity;
    if (ctx.rig.sinker && occ.affinity.sinker != null) weight *= occ.affinity.sinker;
    if (weight > 0) out.push({ occ, species, weight, affinity });
  }
  return out;
}

export function sizeSigma(species: Species, balance: Balance): number {
  const { common, max } = species.lengthCm;
  return clamp(Math.log((0.9 * max) / common) / balance.size.sigmaZ, balance.size.sigmaMin, balance.size.sigmaMax);
}

/**
 * Right-skewed (log-normal) length with its median at the common length.
 * `shift` moves the roll in sigma units: bigger hooks and baits find bigger fish.
 */
export function rollLength(species: Species, rng: Rng, shift: number, balance: Balance): number {
  const sigma = sizeSigma(species, balance);
  let raw = species.lengthCm.common * Math.exp(sigma * (normal(rng) + shift));
  // Nothing grows past the species maximum; the giants crowd just under it.
  if (raw > species.lengthCm.max) raw = species.lengthCm.max * (1 - 0.04 * rng.next());
  return Math.round(clamp(raw, species.lengthCm.min, species.lengthCm.max) * 10) / 10;
}

/** Where a length sits in the species' baseline distribution, 0..1. */
export function sizePercentile(species: Species, lengthCm: number, balance: Balance): number {
  return normCdf(Math.log(lengthCm / species.lengthCm.common) / sizeSigma(species, balance));
}

export function gradeFor(percentile: number, balance: Balance): Grade {
  const g = balance.size.grades;
  if (percentile >= g.record) return 'record';
  if (percentile >= g.trophy) return 'trophy';
  if (percentile >= g.large) return 'large';
  if (percentile < g.small) return 'small';
  return 'average';
}

/** W = a * L^b, with a little individual variation in condition. */
export function weightFor(species: Species, lengthCm: number, rng: Rng | null): number {
  if (!species.lengthWeight) return 0;
  const cond = rng ? range(rng, 0.93, 1.07) : 1;
  return Math.round(species.lengthWeight.a * Math.pow(lengthCm, species.lengthWeight.b) * cond);
}

/** How hard a fish pulls, in the same units as rig power. */
export function fishPull(species: Species, weightG: number, balance: Balance): number {
  if (species.fight.archetype === 'none' || weightG <= 0) return 0;
  return species.fight.strengthFactor * Math.pow(weightG / 1000, balance.power.pullExp);
}

/** Step 5: compare a specific fish to the rig. */
export function makeFishBite(ctx: CatchCtx, species: Species, lengthCm: number, weightG: number): FishBite {
  const b = ctx.content.balance;
  const power = rigPower(ctx.rig);
  const ratio = power > 0 ? fishPull(species, weightG, b) / power : 99;
  const hook = ctx.rig.method === 'lure' ? null : ctx.rig.hook?.hook;
  const tooBig = !!hook && lengthCm > hook.maxCm;
  const outcome = ratio > 1 || tooBig ? 'overmatched' : ratio < b.power.autoLandRatio ? 'auto' : 'fight';
  const percentile = sizePercentile(species, lengthCm, b);
  let hookWindowS = lerp(b.bite.hookWindowMaxS, b.bite.hookWindowMinS, clamp(ratio, 0, 1));
  hookWindowS *= 1 + (ctx.rig.float?.float?.windowBonus ?? 0);
  if (ctx.dark) hookWindowS *= b.bite.darkWindowMult;
  return {
    kind: 'fish', speciesId: species.id, lengthCm, weightG, grade: gradeFor(percentile, b), percentile,
    ratio: tooBig ? Math.max(ratio, 1.6) : ratio, outcome, hookWindowS,
  };
}

/** Steps 3 to 5 for a blind cast: junk roll, species draw, size roll, rig comparison. */
export function resolveBite(ctx: CatchCtx, rng: Rng): Bite {
  const b = ctx.content.balance;
  const zone = ctx.content.locations[ctx.locationId]?.zones.find((z) => z.id === ctx.zoneId);
  if (zone && chance(rng, zone.junkRate)) {
    const table = ctx.content.junk[zone.junkTable];
    const entry = table ? weighted(rng, table.entries, (e) => e.weight) : null;
    if (entry) return { kind: 'junk', itemId: entry.item };
  }
  const pool = candidatePool(ctx);
  if (!pool.length) return { kind: 'none' };
  const hook = ctx.rig.method === 'lure' ? null : ctx.rig.hook?.hook;
  let tooSmall: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const pickd = weighted(rng, pool, (c) => c.weight);
    if (!pickd) return { kind: 'none' };
    const lengthCm = rollLength(pickd.species, rng, sizeShift(ctx.rig), b);
    // Fish below the hook's window cannot take it; they worry the bait instead.
    if (hook && lengthCm < hook.minCm) {
      tooSmall = pickd.species.id;
      continue;
    }
    const bite = makeFishBite(ctx, pickd.species, lengthCm, weightFor(pickd.species, lengthCm, rng));
    // Overmatched fish still bite, at a reduced rate.
    if (bite.outcome === 'overmatched' && !chance(rng, b.bite.overmatchedBiteMult)) {
      tooSmall = null;
      continue;
    }
    return bite;
  }
  return tooSmall ? { kind: 'stolen', speciesId: tooSmall } : { kind: 'nibble' };
}

/** Strikes per second while a lure is worked inside its speed band. */
export function strikeRate(ctx: CatchCtx): number {
  const b = ctx.content.balance.bite;
  const total = candidatePool(ctx).reduce((s, c) => s + c.weight, 0);
  if (total <= 0) return 0;
  return b.lureStrikePerS * clamp(Math.sqrt(total / b.referenceWeight), 0.25, 1.2);
}

export interface WaitPlan {
  waitS: number;
  nibbles: number;
  /** False when nothing in the pool will ever take this rig here and now. */
  active: boolean;
}

/** Busier water bites sooner. */
export function planWait(ctx: CatchCtx, rng: Rng): WaitPlan {
  const b = ctx.content.balance.bite;
  const total = candidatePool(ctx).reduce((s, c) => s + c.weight, 0);
  const activity = clamp(total / b.referenceWeight, 0, 1);
  const base = lerp(b.waitMaxS, b.waitMinS, Math.sqrt(activity));
  return {
    waitS: clamp(base * range(rng, 0.6, 1.3), b.waitMinS, b.waitMaxS),
    nibbles: Math.floor(range(rng, b.nibblesMin, b.nibblesMax + 0.999)),
    active: total > 0,
  };
}

export interface Cruiser {
  speciesId: string;
  lengthCm: number;
  weightG: number;
}

/** A silhouette for a sight zone: who is cruising here now, whatever the rig. */
export function drawCruiser(ctx: Pick<CatchCtx, 'content' | 'locationId' | 'zoneId' | 'phase' | 'month'>, rng: Rng, kinds: Array<'sight' | 'sighting'> = ['sight']): Cruiser | null {
  const occs = (ctx.content.occByLocation[ctx.locationId] ?? []).filter((o) => {
    if (!o.zones.includes(ctx.zoneId)) return false;
    const sp = ctx.content.species[o.speciesId];
    if (!sp) return false;
    const isSighting = sp.kind === 'sighting';
    return isSighting ? kinds.includes('sighting') : kinds.includes('sight') && o.methods.includes('sight');
  });
  const occ = weighted(rng, occs, (o) => presenceWeight(o, ctx));
  if (!occ) return null;
  const species = ctx.content.species[occ.speciesId];
  const lengthCm = rollLength(species, rng, 0, ctx.content.balance);
  return { speciesId: species.id, lengthCm, weightG: weightFor(species, lengthCm, rng) };
}

export type SightReaction = { kind: 'take'; bite: FishBite } | { kind: 'refuse'; reason: 'bait' | 'small-hook' };

/** A sighted fish has noticed the bait or lure. Does it eat? */
export function sightReaction(ctx: CatchCtx, fish: Cruiser, rng: Rng): SightReaction {
  const species = ctx.content.species[fish.speciesId];
  const cand = candidatePool({ ...ctx, method: 'sight' }).find((c) => c.species.id === fish.speciesId);
  if (!cand) return { kind: 'refuse', reason: 'bait' };
  // A poor match is sometimes taken; a good match nearly always.
  if (!chance(rng, clamp(cand.affinity, 0, 1) * 0.92 + 0.04)) return { kind: 'refuse', reason: 'bait' };
  const hook = ctx.rig.method === 'lure' ? null : ctx.rig.hook?.hook;
  if (hook && fish.lengthCm < hook.minCm) return { kind: 'refuse', reason: 'small-hook' };
  return { kind: 'take', bite: makeFishBite(ctx, species, fish.lengthCm, fish.weightG) };
}

/** A creature picked up by hand: same size model, no fight. */
export function resolveHandCatch(ctx: CatchCtx, speciesId: string, rng: Rng): FishBite {
  const species = ctx.content.species[speciesId];
  const lengthCm = rollLength(species, rng, 0, ctx.content.balance);
  const bite = makeFishBite(ctx, species, lengthCm, weightFor(species, lengthCm, rng));
  return { ...bite, outcome: 'auto', ratio: 0 };
}

/** Do all of a legendary's spawn conditions hold for this cast? */
export function legendaryActive(leg: Legendary, ctx: CatchCtx): boolean {
  const s = leg.spawn;
  if (s.locationId !== ctx.locationId || s.zone !== ctx.zoneId) return false;
  if (!s.phases.includes(ctx.phase) || !s.months.includes(ctx.month)) return false;
  if (s.moon && (ctx.moon == null || !s.moon.includes(ctx.moon))) return false;
  const have = new Set([...terminalTags(ctx.rig), ctx.rig.bait?.id, ctx.rig.lure?.id].filter(Boolean) as string[]);
  return s.rig.some((r) => have.has(r));
}

export function legendaryBite(leg: Legendary, ctx: CatchCtx): FishBite {
  const species = ctx.content.species[leg.speciesId];
  const bite = makeFishBite(ctx, species, leg.lengthCm, weightFor(species, leg.lengthCm, null));
  return { ...bite, grade: 'record', percentile: 1, legendaryId: leg.id, hookWindowS: ctx.content.balance.bite.hookWindowMaxS };
}

/** Market price of one fish. */
export function fishValue(species: Species, grade: Grade, balance: Balance, smoked = false): number {
  return Math.max(1, Math.round(species.baseValue * balance.economy.gradeMult[grade] * (smoked ? balance.economy.smokedMult : 1)));
}

/** Vague size words for "one that got away" entries: the player saw a shape, not a tape measure. */
export function sizeClass(lengthCm: number): string {
  if (lengthCm < 25) return 'small';
  if (lengthCm < 50) return 'good-sized';
  if (lengthCm < 90) return 'big';
  if (lengthCm < 140) return 'very big';
  return 'enormous';
}

export function formatWeight(g: number): string {
  if (g <= 0) return '';
  return g < 1000 ? `${Math.round(g)} g` : `${(g / 1000).toFixed(g < 10000 ? 2 : 1)} kg`;
}

export function formatLength(cm: number): string {
  return cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${cm.toFixed(1)} cm`;
}
