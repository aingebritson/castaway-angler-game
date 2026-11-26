/**
 * Who can go where: boats, passages and charts, lessons, and the flood pulse.
 * Shared by the map, the fishing scene, the simulator and the tests.
 */
import type { Content } from '../content/assemble';
import type { Condition, WaterLevel, Zone } from '../content/schema';
import { displayTz, localTime } from '../sim/time';
import { nextWater, waterLevel, zonesAt } from '../sim/water';
import type { Ctx } from './actions';
import type { GameState } from './state';

const has = (s: GameState, id: string): boolean => (s.inventory[id] ?? 0) > 0;

/** The best boat the player owns that can be used in this region, or -1 for none. */
export function boatTier(s: GameState, c: Content, regionId: string): number {
  let t = -1;
  for (const id of Object.keys(s.inventory)) {
    const boat = s.inventory[id] > 0 ? c.items[id]?.boat : undefined;
    if (boat && (!boat.waters || boat.waters.includes(regionId))) t = Math.max(t, boat.tier);
  }
  return t;
}

/** Calendar month (0..11) at a region, read at its first location's clock. */
export function regionMonth(ctx: Ctx, regionId: string): number {
  const loc = Object.values(ctx.content.locations).find((l) => l.regionId === regionId);
  return loc ? localTime(ctx.now, displayTz(loc, ctx.deviceTz)).month : 0;
}

/** Where the water stands in a region right now; null where there is no flood pulse. */
export function waterNow(ctx: Ctx, regionId: string): WaterLevel | null {
  return waterLevel(ctx.content, regionId, regionMonth(ctx, regionId));
}

function holds(s: GameState, ctx: Ctx, u: Condition, regionId: string): boolean {
  switch (u.type) {
    case 'flag': return !!s.flags[u.flag];
    case 'lesson': return s.lessons.includes(u.lesson);
    case 'boat': return boatTier(s, ctx.content, regionId) >= u.tier;
    case 'chart': return has(s, u.chart);
    case 'water': {
      const w = waterNow(ctx, regionId);
      return w != null && u.levels.includes(w);
    }
  }
}

export function regionOpen(s: GameState, ctx: Ctx, regionId: string): boolean {
  const r = ctx.content.regions[regionId];
  return !!r && r.unlock.every((u) => holds(s, ctx, u, regionId));
}

export function locationOpen(s: GameState, ctx: Ctx, locationId: string): boolean {
  const l = ctx.content.locations[locationId];
  return !!l && l.unlock.every((u) => holds(s, ctx, u, l.regionId));
}

/** The zones a location has right now, as the flood pulse leaves them. */
export function zonesNow(ctx: Ctx, locationId: string): Zone[] {
  const loc = ctx.content.locations[locationId];
  return loc ? zonesAt(loc, waterNow(ctx, loc.regionId)) : [];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Why a place is closed, in the player's words, or null when it is open. */
export function lockReason(s: GameState, ctx: Ctx, locationId: string): string | null {
  const l = ctx.content.locations[locationId];
  if (!l) return null;
  for (const u of l.unlock) {
    if (holds(s, ctx, u, l.regionId)) continue;
    if (u.type === 'lesson') return 'I have not found a reason to go there yet. Keep fishing.';
    if (u.type === 'water') {
      const next = nextWater(ctx.content, l.regionId, regionMonth(ctx, l.regionId), u.levels);
      return `Not at this water. ${l.name} is only there when the river is ${u.levels.join(' or ')}${next ? `; that comes again about ${MONTHS[next.month]}` : ''}.`;
    }
    if (u.type === 'boat') return 'Too far for what I have to float in. The boatyard has something that would reach it.';
    return 'Out of reach for now.';
  }
  return null;
}
