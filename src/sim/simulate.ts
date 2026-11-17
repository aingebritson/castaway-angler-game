/**
 * Balance simulator core: casts a rig N times at a place and instant, with a
 * bot at the reel, and reports what came up. Used by `npm run sim` and tests.
 */
import type { Content } from '../content/assemble';
import type { Rarity } from '../content/schema';
import { type CatchCtx, type Rig, castRange, drawCruiser, fishValue, planWait, resolveBite, rigPower, sightReaction, strikeRate } from './catch';
import { simulateFight } from './fight';
import { makeRng } from './rng';
import { moonIndex, sunInfo } from './time';

export interface SimOptions {
  locationId: string;
  rigId: string;
  casts: number;
  at: number;
  seed?: number;
  zoneId?: string;
  deviceTz?: string;
  method?: 'bait' | 'lure' | 'sight';
}

export interface SpeciesRow {
  speciesId: string;
  name: string;
  rarity: Rarity;
  bites: number;
  landed: number;
  lost: number;
  meanCm: number;
  maxCm: number;
  meanFightS: number;
}

export interface ZoneReport {
  zoneId: string;
  zoneName: string;
  reachable: boolean;
  casts: number;
  rows: SpeciesRow[];
  junk: number;
  none: number;
  nibble: number;
  stolen: number;
  fishBites: number;
  rarityShare: Record<Rarity, number>;
  outcomes: { auto: number; fight: number; overmatched: number };
  landRate: number;
  meanWaitS: number;
  meanFightS: number;
  meanCycleS: number;
  coinsPerHour: number;
  catchesPerHour: number;
}

export interface SimReport {
  locationName: string;
  rigLabel: string;
  phase: string;
  month: number;
  localTime: string;
  power: number;
  range: number;
  zones: ZoneReport[];
}

export function rigFromPreset(content: Content, rigId: string): Rig {
  const p = content.rigs[rigId];
  if (!p) throw new Error(`Unknown rig "${rigId}". Known: ${Object.keys(content.rigs).join(', ')}`);
  const g = (id?: string) => (id ? content.items[id] ?? null : null);
  return {
    rod: content.items[p.rod], line: content.items[p.line], reel: g(p.reel), hook: g(p.hook), bait: g(p.bait), lure: g(p.lure),
    float: g(p.float), sinker: g(p.sinker), method: p.method === 'sight' ? (p.lure ? 'lure' : 'bait') : p.method,
  };
}

/** Seconds spent on casting, the reveal card and re-baiting, per cast. */
const OVERHEAD_S = 9;

export function runSim(content: Content, opts: SimOptions): SimReport {
  const loc = content.locations[opts.locationId];
  if (!loc) throw new Error(`Unknown location "${opts.locationId}". Known: ${Object.keys(content.locations).join(', ')}`);
  const rig = rigFromPreset(content, opts.rigId);
  const preset = content.rigs[opts.rigId];
  const method = opts.method ?? preset.method;
  const sun = sunInfo(opts.at, loc, opts.deviceTz ?? loc.solarTz ?? 'UTC', content.balance);
  const b = content.balance;
  const range = castRange(rig);
  const zones = loc.zones.filter((z) => z.cast && (!opts.zoneId || z.id === opts.zoneId));
  const reports: ZoneReport[] = [];

  for (const [zi, zone] of zones.entries()) {
    const rng = makeRng((opts.seed ?? 1) + zi * 7919);
    const reachable = range >= zone.minCastRange;
    const ctx: CatchCtx = {
      content, locationId: loc.id, zoneId: zone.id, phase: sun.phase, month: sun.local.month, rig,
      method: method === 'sight' ? 'sight' : rig.method, moon: moonIndex(opts.at),
    };
    const rows = new Map<string, SpeciesRow & { sumCm: number; sumFight: number; fights: number }>();
    const rep: ZoneReport = {
      zoneId: zone.id, zoneName: zone.name, reachable, casts: reachable ? opts.casts : 0, rows: [], junk: 0, none: 0, nibble: 0, stolen: 0,
      fishBites: 0, rarityShare: { common: 0, uncommon: 0, rare: 0, epic: 0 }, outcomes: { auto: 0, fight: 0, overmatched: 0 },
      landRate: 0, meanWaitS: 0, meanFightS: 0, meanCycleS: 0, coinsPerHour: 0, catchesPerHour: 0,
    };
    let waitTotal = 0;
    let fightTotal = 0;
    let fights = 0;
    let landed = 0;
    let coins = 0;
    for (let i = 0; reachable && i < opts.casts; i++) {
      let bite;
      if (method === 'sight') {
        // Sight casting: a cruiser is spotted, the cast is assumed good, the fish decides.
        waitTotal += 12;
        const fish = drawCruiser(ctx, rng);
        if (!fish) { rep.none++; continue; }
        const r = sightReaction(ctx, fish, rng);
        if (r.kind === 'refuse') { rep.nibble++; continue; }
        bite = r.bite;
      } else if (rig.method === 'lure') {
        // One retrieve, worked inside the lure's speed band about two thirds of the time.
        const retrieveS = 4 + 8 * Math.min(1, zone.minCastRange + 0.25);
        const tStrike = -Math.log(1 - rng.next()) / Math.max(1e-6, strikeRate(ctx) * 0.66);
        waitTotal += Math.min(retrieveS, tStrike);
        if (tStrike > retrieveS) { rep.none++; continue; }
        bite = resolveBite(ctx, rng);
      } else {
        const plan = planWait(ctx, rng);
        waitTotal += plan.waitS;
        bite = resolveBite(ctx, rng);
      }
      if (bite.kind === 'junk') { rep.junk++; continue; }
      if (bite.kind === 'none') { rep.none++; continue; }
      if (bite.kind === 'nibble') { rep.nibble++; continue; }
      if (bite.kind === 'stolen') { rep.stolen++; continue; }
      const sp = content.species[bite.speciesId];
      const occ = (content.occByLocation[loc.id] ?? []).find((o) => o.speciesId === sp.id && o.zones.includes(zone.id))!;
      rep.fishBites++;
      rep.rarityShare[occ.rarity]++;
      rep.outcomes[bite.outcome]++;
      let row = rows.get(sp.id);
      if (!row) {
        row = { speciesId: sp.id, name: sp.commonName, rarity: occ.rarity, bites: 0, landed: 0, lost: 0, meanCm: 0, maxCm: 0, meanFightS: 0, sumCm: 0, sumFight: 0, fights: 0 };
        rows.set(sp.id, row);
      }
      row.bites++;
      row.sumCm += bite.lengthCm;
      row.maxCm = Math.max(row.maxCm, bite.lengthCm);
      let won = true;
      let secs = b.fight.autoLandS;
      if (bite.outcome !== 'auto') {
        const res = simulateFight({ species: sp, ratio: bite.ratio, startDist: Math.min(1, zone.minCastRange + 0.2), greenBonus: rig.reel?.reel?.greenBonus ?? 0 }, rng, b);
        won = res.outcome === 'landed';
        secs = res.seconds;
        fights++;
        fightTotal += secs;
        row.fights++;
        row.sumFight += secs;
      }
      if (won) {
        row.landed++;
        landed++;
        if (!sp.conservation.releaseOnly) coins += fishValue(sp, bite.grade, b);
      } else row.lost++;
    }
    const totalS = waitTotal + fightTotal + rep.casts * OVERHEAD_S;
    rep.rows = [...rows.values()]
      .map(({ sumCm, sumFight, fights: f, ...r }) => ({ ...r, meanCm: r.bites ? sumCm / r.bites : 0, meanFightS: f ? sumFight / f : 0 }))
      .sort((a, c) => c.bites - a.bites);
    for (const k of Object.keys(rep.rarityShare) as Rarity[]) rep.rarityShare[k] = rep.fishBites ? rep.rarityShare[k] / rep.fishBites : 0;
    rep.landRate = rep.fishBites ? landed / rep.fishBites : 0;
    rep.meanWaitS = rep.casts ? waitTotal / rep.casts : 0;
    rep.meanFightS = fights ? fightTotal / fights : 0;
    rep.meanCycleS = rep.casts ? totalS / rep.casts : 0;
    rep.coinsPerHour = totalS ? (coins / totalS) * 3600 : 0;
    rep.catchesPerHour = totalS ? (landed / totalS) * 3600 : 0;
    reports.push(rep);
  }
  const hh = String(sun.local.hour).padStart(2, '0');
  const mm = String(sun.local.minute).padStart(2, '0');
  return {
    locationName: loc.name, rigLabel: preset.label, phase: sun.phase, month: sun.local.month, localTime: `${sun.local.dayKey} ${hh}:${mm}`,
    power: rigPower(rig), range, zones: reports,
  };
}
