import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import { type CatchCtx, candidatePool, gradeFor, makeFishBite, planWait, resolveBite, rollLength, sizePercentile, weightFor } from '../src/sim/catch';
import { simulateFight, startFight, stepFight } from '../src/sim/fight';
import { hashSeed, makeRng, normCdf, weighted } from '../src/sim/rng';
import { rigFromPreset, runSim } from '../src/sim/simulate';
import { localTime, moonIndex, sunInfo } from '../src/sim/time';
import { craftCheck, pickProvisions, recipeView, refreshNode, resolveTrap, tablePick } from '../src/sim/world';

const { content, issues } = loadContentNode();
const b = content.balance;
const NOON = Date.parse('2027-01-15T18:00:00Z'); // noon in Belize

function ctx(rigId: string, locationId = 'rocky-point', zoneId = 'shallows', phase: CatchCtx['phase'] = 'day'): CatchCtx {
  const rig = rigFromPreset(content, rigId);
  return { content, locationId, zoneId, phase, month: 0, rig, method: rig.method };
}

describe('content', () => {
  it('validates with no errors', () => {
    expect(issues.errors).toEqual([]);
  });
  it('every species and occurrence carries a source', () => {
    for (const sp of Object.values(content.species)) expect(sp.sources.length).toBeGreaterThan(0);
    for (const o of content.occurrences) expect(o.sources.length).toBeGreaterThan(0);
  });
  it('length-weight parameters give a plausible weight at maximum length', () => {
    for (const sp of Object.values(content.species)) {
      if (!sp.lengthWeight) continue;
      const kg = weightFor(sp, sp.lengthCm.max, null) / 1000;
      expect(kg, sp.id).toBeGreaterThan(0);
      expect(kg, sp.id).toBeLessThan(200);
    }
  });
  it('no species needed for progression depends on a narrow real-time window', () => {
    // Guard rail: from the starter rig, something bites at Rocky Point in every phase of every month.
    for (const phase of ['dawn', 'day', 'dusk', 'night'] as const) {
      for (let month = 0; month < 12; month++) {
        const c = { ...ctx('starter', 'rocky-point', 'shallows', phase), month };
        expect(candidatePool(c).length, `${phase} month ${month}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('rng', () => {
  it('is deterministic for a seed and resumable from its state', () => {
    const a = makeRng(42);
    const first = [a.next(), a.next(), a.next()];
    const again = makeRng(42);
    expect([again.next(), again.next(), again.next()]).toEqual(first);
    const resumed = makeRng(a.state());
    expect(resumed.next()).toBe(a.next());
  });
  it('weighted draw follows the weights', () => {
    const r = makeRng(7);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 10000; i++) counts[weighted(r, ['a', 'b'] as const, (x) => (x === 'a' ? 3 : 1))!]++;
    expect(counts.a / counts.b).toBeGreaterThan(2.6);
    expect(counts.a / counts.b).toBeLessThan(3.4);
    expect(weighted(r, ['a'], () => 0)).toBeNull();
  });
  it('normCdf and hashSeed behave', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 5);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 2);
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
    expect(hashSeed('a')).toBe(hashSeed('a'));
  });
});

describe('time', () => {
  it('reads local wall-clock time in a zone', () => {
    const t = localTime(NOON, 'America/Belize');
    expect([t.hour, t.minute, t.month, t.day]).toEqual([12, 0, 0, 15]);
    expect(t.dayKey).toBe('2027-01-15');
  });
  it('computes the four phases from the real sun', () => {
    const loc = content.locations['rocky-point'];
    const at = (h: number) => sunInfo(NOON + (h - 12) * 3600_000, loc, 'America/Belize', b).phase;
    expect(at(12)).toBe('day');
    expect(at(6.4)).toBe('dawn');
    expect(at(17.5)).toBe('dusk');
    expect(at(23)).toBe('night');
    expect(at(2)).toBe('night');
  });
  it('runs the island on the device clock, whatever zone the phone is in', () => {
    const loc = content.locations.beach;
    // 12:00 in Tokyo is "day" on the island even though it is night in the Caribbean.
    const tokyoNoon = Date.parse('2027-01-15T03:00:00Z');
    expect(sunInfo(tokyoNoon, loc, 'Asia/Tokyo', b).phase).toBe('day');
    expect(sunInfo(tokyoNoon, loc, 'America/Belize', b).phase).toBe('night');
  });
  it('gives a moon index 0..7', () => {
    const m = moonIndex(NOON);
    expect(m).toBeGreaterThanOrEqual(0);
    expect(m).toBeLessThan(8);
  });
});

describe('catch model', () => {
  it('same seed, clock and inputs give the same catches', () => {
    const run = () => {
      const r = makeRng(99);
      return Array.from({ length: 50 }, () => JSON.stringify(resolveBite(ctx('starter'), r)));
    };
    expect(run()).toEqual(run());
  });
  it('day fish are absent at night and night fish by day', () => {
    const day = candidatePool(ctx('starter', 'rocky-point', 'shallows', 'day')).map((c) => c.species.id);
    const night = candidatePool(ctx('starter', 'rocky-point', 'shallows', 'night')).map((c) => c.species.id);
    expect(day).toContain('abudefduf-saxatilis');
    expect(night).not.toContain('abudefduf-saxatilis');
    expect(night).toContain('holocentrus-adscensionis');
    expect(day).not.toContain('holocentrus-adscensionis');
  });
  it('lure-only fish ignore bait', () => {
    const bait = candidatePool(ctx('angler', 'rocky-point', 'reef-edge')).map((c) => c.species.id);
    const lure = candidatePool(ctx('angler-lure', 'rocky-point', 'reef-edge')).map((c) => c.species.id);
    expect(bait).not.toContain('caranx-ruber');
    expect(lure).toContain('caranx-ruber');
  });
  it('rolls right-skewed sizes: median near common, under 1% past 90% of maximum', () => {
    const sp = content.species['albula-vulpes'];
    const r = makeRng(5);
    const xs = Array.from({ length: 20000 }, () => rollLength(sp, r, 0, b)).sort((x, y) => x - y);
    expect(xs[10000]).toBeGreaterThan(sp.lengthCm.common * 0.95);
    expect(xs[10000]).toBeLessThan(sp.lengthCm.common * 1.05);
    expect(xs.filter((x) => x > 0.9 * sp.lengthCm.max).length / xs.length).toBeLessThan(0.012);
    expect(Math.max(...xs)).toBeLessThanOrEqual(sp.lengthCm.max);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(sp.lengthCm.min);
  });
  it('bigger hooks and baits shift the roll toward bigger fish', () => {
    const sp = content.species['ocyurus-chrysurus'];
    const mean = (shift: number) => {
      const r = makeRng(3);
      let t = 0;
      for (let i = 0; i < 5000; i++) t += rollLength(sp, r, shift, b);
      return t / 5000;
    };
    expect(mean(0.75)).toBeGreaterThan(mean(0) * 1.08);
  });
  it('grades by percentile', () => {
    const sp = content.species['albula-vulpes'];
    expect(gradeFor(sizePercentile(sp, sp.lengthCm.common, b), b)).toBe('average');
    expect(gradeFor(0.1, b)).toBe('small');
    expect(gradeFor(0.8, b)).toBe('large');
    expect(gradeFor(0.96, b)).toBe('trophy');
    expect(gradeFor(0.999, b)).toBe('record');
  });
  it('compares fish to rig: auto-land, fight, overmatched', () => {
    const c = ctx('starter');
    const wrasse = content.species['thalassoma-bifasciatum'];
    const bone = content.species['albula-vulpes'];
    expect(makeFishBite(c, wrasse, 10, weightFor(wrasse, 10, null)).outcome).toBe('auto');
    // a bonefish is both too strong for the old line and too long for the rusty hook
    expect(makeFishBite(c, bone, 50, weightFor(bone, 50, null)).outcome).toBe('overmatched');
    const angler = ctx('angler-crab', 'lagoon', 'flats');
    expect(makeFishBite(angler, bone, 50, weightFor(bone, 50, null)).outcome).toBe('fight');
  });
  it('small fish get a wider hook window than strong ones', () => {
    const c = ctx('angler');
    const grunt = content.species['haemulon-flavolineatum'];
    const mutton = content.species['lutjanus-analis'];
    const a = makeFishBite(c, grunt, 20, weightFor(grunt, 20, null)).hookWindowS;
    const m = makeFishBite(c, mutton, 60, weightFor(mutton, 60, null)).hookWindowS;
    expect(a).toBeGreaterThan(m);
    expect(m).toBeGreaterThanOrEqual(b.bite.hookWindowMinS);
  });
  it('plans a wait inside the configured range, and flags dead water', () => {
    const r = makeRng(1);
    for (let i = 0; i < 200; i++) {
      const p = planWait(ctx('starter'), r);
      expect(p.waitS).toBeGreaterThanOrEqual(b.bite.waitMinS);
      expect(p.waitS).toBeLessThanOrEqual(b.bite.waitMaxS);
      expect(p.active).toBe(true);
    }
    // a feather lure fished as "bait" finds nothing: wrong rig for the method
    const dead = { ...ctx('angler-lure'), method: 'bait' as const };
    expect(planWait(dead, r).active).toBe(false);
  });
});

describe('fight model', () => {
  const grunt = content.species['haemulon-flavolineatum'];
  const tarpon = content.species['megalops-atlanticus'];
  it('a modest fish is landed by a competent angler', () => {
    const r = makeRng(11);
    let landed = 0;
    for (let i = 0; i < 200; i++) if (simulateFight({ species: grunt, ratio: 0.5, startDist: 0.5 }, r, b).outcome === 'landed') landed++;
    expect(landed).toBeGreaterThan(180);
  });
  it('an overmatched fish is close to unwinnable', () => {
    const r = makeRng(12);
    let landed = 0;
    for (let i = 0; i < 200; i++) if (simulateFight({ species: tarpon, ratio: 3.5, startDist: 0.6 }, r, b).outcome === 'landed') landed++;
    expect(landed).toBeLessThan(4);
  });
  it('holding in the red snaps the line; never reeling pulls the hook or spools', () => {
    const r = makeRng(13);
    const snap = startFight({ species: tarpon, ratio: 0.95, startDist: 0.5 }, r);
    while (snap.outcome === 'fighting' && snap.elapsed < 60) stepFight(snap, true, 1 / 30, r, b);
    expect(snap.outcome).toBe('snapped');
    const slack = startFight({ species: grunt, ratio: 0.3, startDist: 0.5 }, r);
    while (slack.outcome === 'fighting' && slack.elapsed < 60) stepFight(slack, false, 1 / 30, r, b);
    expect(['pulled', 'spooled']).toContain(slack.outcome);
  });
  it('stronger, fitter fish take longer', () => {
    const time = (stamina: number) => {
      const r = makeRng(14);
      const sp = { ...grunt, fight: { ...grunt.fight, stamina } };
      let t = 0;
      for (let i = 0; i < 100; i++) t += simulateFight({ species: sp, ratio: 0.7, startDist: 0.5 }, r, b).seconds;
      return t / 100;
    };
    expect(time(30)).toBeGreaterThan(time(5) * 1.8);
  });
});

describe('world', () => {
  const node = { item: 'stone', max: 4, regrowMin: 10 };
  it('regrows on a timer and stops at the cap', () => {
    const t0 = 1_000_000;
    let s = refreshNode(node, undefined, t0, 'd');
    expect(s.stock).toBe(4);
    s = { ...s, stock: 0, t: t0 };
    expect(refreshNode(node, s, t0 + 9 * 60_000, 'd').stock).toBe(0);
    expect(refreshNode(node, s, t0 + 25 * 60_000, 'd').stock).toBe(2);
    expect(refreshNode(node, s, t0 + 999 * 60_000, 'd').stock).toBe(4);
  });
  it('infinite nodes never run dry, daily nodes restock at the day change', () => {
    const inf = { item: 'shell', max: 5, regrowMin: 4, infinite: true };
    expect(refreshNode(inf, { stock: 0, t: 0 }, 1000, 'd').stock).toBe(1);
    const daily = { item: 'rope', max: 4, regrowMin: 1440, daily: true };
    expect(refreshNode(daily, { stock: 0, t: 0, day: 'a' }, 5, 'a').stock).toBe(0);
    expect(refreshNode(daily, { stock: 0, t: 0, day: 'a' }, 5, 'b').stock).toBe(4);
  });
  it('table picks are stable for a seed', () => {
    const def = content.locations.beach.scene.hotspots.find((h) => h.id === 'wrack')!.node!;
    expect(tablePick(def, 5, 'k', 1)).toBe(tablePick(def, 5, 'k', 1));
  });
  it('recipes go hidden, silhouette, known', () => {
    const r = content.recipes['stone-knife'];
    expect(recipeView(r, {}, [])).toBe('hidden');
    expect(recipeView(r, { stone: true }, [])).toBe('silhouette');
    expect(recipeView(r, { stone: true, vine: true, hammerstone: true }, [])).toBe('known');
    expect(recipeView(r, {}, ['stone-knife'])).toBe('known');
    expect(recipeView(content.recipes['shell-hook'], {}, [])).toBe('known');
  });
  it('craft check reports what is missing', () => {
    const r = content.recipes['stone-knife'];
    expect(craftCheck(r, { stone: 2, vine: 1, hammerstone: 1 }).ok).toBe(true);
    const c = craftCheck(r, { stone: 1 });
    expect(c.ok).toBe(false);
    expect(c.missing.map((m) => m.item).sort()).toEqual(['stone', 'vine']);
    expect(c.missingTools).toEqual(['hammerstone']);
  });
  it('provisions need five smoked fish of three kinds', () => {
    const f = (id: string) => ({ speciesId: id });
    expect(pickProvisions([f('a'), f('a'), f('a'), f('a'), f('a')], 5, 3)).toBeNull();
    expect(pickProvisions([f('a'), f('b'), f('c'), f('a')], 5, 3)).toBeNull();
    expect(pickProvisions([f('a'), f('a'), f('b'), f('a'), f('c'), f('a')], 5, 3)).toHaveLength(5);
  });
  it('a trap needs its minimum soak, fills with time, and is stable when re-checked', () => {
    const trap = { locationId: 'rocky-point', zoneId: 'shallows', itemId: 'woven-trap', baitId: 'cut-bait', setAt: 0 };
    const rod = content.items['old-rod'];
    const line = content.items['old-line'];
    const haul = (h: number) => resolveTrap(trap, h * 3600_000, content, 77, ['night'], 0, rod, line);
    expect(haul(0.5).ready).toBe(false);
    const eight = haul(8);
    expect(eight.ready).toBe(true);
    expect(eight.catches.length).toBeLessThanOrEqual(content.items['woven-trap'].trap!.capacity);
    expect(haul(8).catches.map((c) => c.speciesId)).toEqual(eight.catches.map((c) => c.speciesId));
    let total = 0;
    for (let seed = 0; seed < 60; seed++) total += resolveTrap(trap, 8 * 3600_000, content, seed, ['night'], 0, rod, line).catches.length;
    expect(total / 60).toBeGreaterThan(1.5);
  });
});

describe('simulator and gating', () => {
  const at = Date.parse('2027-01-15T16:00:00Z');
  it('prints a distribution, and it is reproducible', () => {
    const a = runSim(content, { locationId: 'rocky-point', rigId: 'starter', casts: 2000, at, seed: 3 });
    const c = runSim(content, { locationId: 'rocky-point', rigId: 'starter', casts: 2000, at, seed: 3 });
    expect(a).toEqual(c);
    expect(a.zones[0].rows.length).toBeGreaterThan(2);
  });
  it('stage 0 reaches only the shallows and lands small common fish', () => {
    const r = runSim(content, { locationId: 'rocky-point', rigId: 'starter', casts: 3000, at });
    const [shallows, edge, deep] = r.zones;
    expect(shallows.reachable).toBe(true);
    expect(edge.reachable).toBe(false);
    expect(deep.reachable).toBe(false);
    expect(shallows.rarityShare.common).toBeGreaterThan(0.6);
    expect(shallows.meanCycleS).toBeLessThan(60);
  });
  it('stage 1 reaches the reef edge but cannot stop what lives there', () => {
    const r = runSim(content, { locationId: 'rocky-point', rigId: 'toolmaker', casts: 4000, at });
    const edge = r.zones[1];
    expect(edge.reachable).toBe(true);
    const mutton = edge.rows.find((x) => x.speciesId === 'lutjanus-analis');
    if (mutton) expect(mutton.landed / mutton.bites).toBeLessThan(0.1);
    expect(edge.outcomes.overmatched).toBeGreaterThan(0);
  });
  it('stage 2 lands reef-edge fish, and the drop-off stays out of reach on the island', () => {
    const r = runSim(content, { locationId: 'rocky-point', rigId: 'angler', casts: 4000, at });
    expect(r.zones[1].landRate).toBeGreaterThan(0.85);
    expect(r.zones[2].reachable).toBe(false);
  });
  it('tarpon stay unwinnable on island gear', () => {
    const dawn = Date.parse('2027-06-15T11:45:00Z');
    const r = runSim(content, { locationId: 'lagoon', rigId: 'angler-lure', casts: 6000, at: dawn, zoneId: 'channel' });
    const tarpon = r.zones[0].rows.find((x) => x.speciesId === 'megalops-atlanticus');
    expect(tarpon).toBeDefined();
    expect(tarpon!.landed).toBe(0);
  });
});
