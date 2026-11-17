/**
 * World bookkeeping that runs on timestamps: regrowth, traps, the drying rack,
 * crafting checks. Nothing here runs in the background; everything is computed
 * from "then" and "now" when the player looks.
 */
import type { Content } from '../content/assemble';
import type { GatherNode, Item, Phase, Recipe } from '../content/schema';
import { type CatchCtx, type FishBite, type Rig, candidatePool, makeFishBite, rollLength, weightFor } from './catch';
import { type Rng, hashSeed, makeRng, weighted } from './rng';

export interface NodeSave {
  stock: number;
  /** Timestamp the regrow timer last ticked from. */
  t: number;
  /** Local day key of the last daily restock. */
  day?: string;
}

/** Bring a node's stock up to date. Returns a new save; never mutates. */
export function refreshNode(def: GatherNode, save: NodeSave | undefined, now: number, dayKey: string): NodeSave {
  if (!save) return { stock: def.max, t: now, day: dayKey };
  if (def.daily) {
    if (save.day !== dayKey) return { stock: def.max, t: now, day: dayKey };
    return save;
  }
  if (save.stock >= def.max) return { ...save, stock: def.max, t: now };
  const per = def.regrowMin * 60_000;
  const grown = Math.floor(Math.max(0, now - save.t) / per);
  if (grown <= 0) return def.infinite && save.stock < 1 ? { ...save, stock: 1 } : save;
  const stock = Math.min(def.max, save.stock + grown);
  return { ...save, stock: def.infinite ? Math.max(1, stock) : stock, t: stock >= def.max ? now : save.t + grown * per };
}

/** Milliseconds until the next unit regrows, or 0 when full or daily. */
export function nodeEta(def: GatherNode, save: NodeSave, now: number): number {
  if (def.daily || save.stock >= def.max) return 0;
  return Math.max(0, save.t + def.regrowMin * 60_000 - now);
}

export function nodeOpen(def: GatherNode, phase: Phase): boolean {
  return !def.phases || def.phases.includes(phase);
}

/** Which item a table node yields on its nth pick of the day: seeded, so a reload cannot reroll it. */
export function tablePick(def: GatherNode, seed: number, key: string, nth: number): string | null {
  if (!def.table) return def.item ?? null;
  const rng = makeRng(hashSeed(`${key}#${nth}`, seed));
  return weighted(rng, def.table, (e) => e.weight)?.item ?? null;
}

export interface TrapSave {
  locationId: string;
  zoneId: string;
  itemId: string;
  baitId: string | null;
  setAt: number;
}

export interface TrapHaul {
  ready: boolean;
  soakH: number;
  catches: FishBite[];
}

/**
 * What is in a trap when it is hauled. The catch is a function of the trap's
 * own timestamps and the save seed, so it is stable however often it is checked.
 */
export function resolveTrap(trap: TrapSave, now: number, content: Content, seed: number, phases: Phase[], month: number, rod: Item, line: Item): TrapHaul {
  const def = content.items[trap.itemId]?.trap;
  if (!def) return { ready: false, soakH: 0, catches: [] };
  const soakH = Math.max(0, (now - trap.setAt) / 3_600_000);
  if (soakH < def.minSoakH) return { ready: false, soakH, catches: [] };
  const rng = makeRng(hashSeed(`${trap.locationId}/${trap.zoneId}/${trap.setAt}`, seed));
  const effective = Math.min(soakH, def.maxSoakH);
  const expected = effective * content.balance.trap.catchesPerHour * (trap.baitId ? 1 : 0.4);
  let count = Math.floor(expected);
  if (rng.next() < expected - count) count++;
  count = Math.min(def.capacity, count);
  const bait = trap.baitId ? content.items[trap.baitId] ?? null : null;
  const rig: Rig = { rod, line, reel: null, hook: null, bait, lure: null, float: null, sinker: null, method: 'bait' };
  const catches: FishBite[] = [];
  for (let i = 0; i < count; i++) {
    // A trap soaks across the day, so each animal is drawn at one of the phases it soaked through.
    const phase = phases[Math.floor(rng.next() * phases.length)] ?? 'night';
    const ctx: CatchCtx = { content, locationId: trap.locationId, zoneId: trap.zoneId, phase, month, rig, method: def.method };
    const pickd = weighted(rng, candidatePool(ctx), (c) => c.weight);
    if (!pickd) continue;
    const lengthCm = rollLength(pickd.species, rng, 0, content.balance);
    const bite = makeFishBite(ctx, pickd.species, lengthCm, weightFor(pickd.species, lengthCm, rng));
    catches.push({ ...bite, outcome: 'auto', ratio: 0 });
  }
  return { ready: true, soakH, catches };
}

/** The phases a soak passed through, for trap draws. Coarse on purpose. */
export function soakPhases(soakH: number, phaseAtHaul: Phase): Phase[] {
  if (soakH >= 10) return ['dawn', 'day', 'day', 'dusk', 'night', 'night'];
  const order: Phase[] = ['dawn', 'day', 'dusk', 'night'];
  const i = order.indexOf(phaseAtHaul);
  if (soakH >= 4) return [phaseAtHaul, order[(i + 3) % 4], order[(i + 3) % 4]];
  return [phaseAtHaul];
}

export type RecipeView = 'hidden' | 'silhouette' | 'known';

/**
 * A recipe shows as a silhouette once the player has held one ingredient, and
 * is worked out in full once they have held every ingredient and tool. Journal
 * pages reveal recipes early.
 */
export function recipeView(recipe: Recipe, everHeld: Record<string, unknown>, revealed: readonly string[]): RecipeView {
  if (recipe.known === 'start' || revealed.includes(recipe.id)) return 'known';
  if (recipe.known === 'taught') return 'hidden';
  const parts = [...recipe.inputs.map((i) => i.item), ...recipe.tools, ...(recipe.station ? [recipe.station] : [])];
  if (!parts.length) return 'hidden';
  const held = parts.filter((p) => everHeld[p]).length;
  if (held === parts.length) return 'known';
  return held > 0 ? 'silhouette' : 'hidden';
}

export interface CraftCheck {
  ok: boolean;
  missing: { item: string; need: number; have: number }[];
  missingTools: string[];
}

export function craftCheck(recipe: Recipe, inventory: Record<string, number>): CraftCheck {
  const missing = recipe.inputs
    .map((i) => ({ item: i.item, need: i.qty, have: inventory[i.item] ?? 0 }))
    .filter((m) => m.have < m.need);
  const missingTools = [...recipe.tools, ...(recipe.station ? [recipe.station] : [])].filter((t) => !(inventory[t] > 0));
  return { ok: !missing.length && !missingTools.length, missing, missingTools };
}

export interface Smoked {
  speciesId: string;
}

/** Provisions need N smoked fish covering at least M species. Returns the indices to use, or null. */
export function pickProvisions(larder: readonly Smoked[], fish: number, species: number): number[] | null {
  if (larder.length < fish) return null;
  const chosen: number[] = [];
  const seen = new Set<string>();
  larder.forEach((f, i) => {
    if (!seen.has(f.speciesId) && chosen.length < fish) {
      seen.add(f.speciesId);
      chosen.push(i);
    }
  });
  if (seen.size < species) return null;
  for (let i = 0; i < larder.length && chosen.length < fish; i++) if (!chosen.includes(i)) chosen.push(i);
  return chosen.length === fish ? chosen : null;
}

/** Deterministic daily order book for a port. */
export function dailySeed(seed: number, key: string, dayKey: string): Rng {
  return makeRng(hashSeed(`${key}@${dayKey}`, seed));
}
