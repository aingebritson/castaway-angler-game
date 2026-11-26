/**
 * The flood pulse (spec section 7, region 2). A river region carries a water
 * level for each calendar month; zones and places that exist only at some
 * levels come and go with it. Pure: the month is passed in.
 */
import type { Content } from '../content/assemble';
import type { Location, WaterLevel, Zone } from '../content/schema';

/** Where the water stands in a region this month, or null for regions without a flood pulse. */
export function waterLevel(content: Content, regionId: string, month: number): WaterLevel | null {
  return content.regions[regionId]?.water?.[month] ?? null;
}

/** Does a zone exist at this water level? Zones without a `water` list always do. */
export function zoneExists(zone: Zone, level: WaterLevel | null): boolean {
  return !zone.water || (level != null && zone.water.includes(level));
}

/** The zones of a location as they stand at this water level. */
export function zonesAt(loc: Location, level: WaterLevel | null): Zone[] {
  return loc.zones.filter((z) => zoneExists(z, level));
}

/** The background art for this water level, falling back to the scene's own. */
export function backgroundAt(loc: Location, level: WaterLevel | null): string {
  return (level && loc.scene.backgrounds?.[level]) || loc.scene.background;
}

/**
 * The next month (0..11) after `month` when the water reaches one of `levels`,
 * and how many months away that is. Null if it never does.
 */
export function nextWater(content: Content, regionId: string, month: number, levels: readonly WaterLevel[]): { month: number; inMonths: number } | null {
  const cal = content.regions[regionId]?.water;
  if (!cal) return null;
  for (let k = 1; k <= 12; k++) {
    const m = (month + k) % 12;
    if (levels.includes(cal[m])) return { month: m, inMonths: k };
  }
  return null;
}
