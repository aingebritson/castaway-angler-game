import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import { type CatchCtx, legendaryActive, legendaryBite, spoolOf, weightFor } from '../src/sim/catch';
import { simulateFight } from '../src/sim/fight';
import { makeRng } from '../src/sim/rng';
import { rigFromPreset } from '../src/sim/simulate';
import { type Ctx, addItem, cond, keepFish, recordCatch, releaseFish, travel } from '../src/state/actions';
import { badges, donate, trophyWall, wingSpecies, wings } from '../src/state/museum';
import { acceptQuest, buy, turnIn } from '../src/state/port';
import { newGame } from '../src/state/state';

const { content } = loadContentNode();
const b = content.balance;
const NOW = Date.parse('2027-03-10T15:00:00Z');
const ctx: Ctx = { content, now: NOW, deviceTz: 'America/Belize' };

function legendCtx(legId: string, rigId: string, over: Partial<CatchCtx> = {}): CatchCtx {
  const l = content.legendaries[legId];
  return {
    content, locationId: l.spawn.locationId, zoneId: l.spawn.zone, phase: l.spawn.phases[0], month: l.spawn.months[0],
    rig: rigFromPreset(content, rigId), method: 'bait', moon: l.spawn.moon?.[0] ?? 0, ...over,
  };
}

function fights(legId: string, rigId: string, n = 300) {
  const c = legendCtx(legId, rigId);
  const leg = content.legendaries[legId];
  const bite = legendaryBite(leg, c);
  const sp = content.species[bite.speciesId];
  const r = makeRng(9);
  let won = 0;
  let secs = 0;
  for (let i = 0; i < n; i++) {
    const res = simulateFight({ species: sp, ratio: bite.ratio, startDist: 0.8, greenBonus: c.rig.reel?.reel?.greenBonus ?? 0, capacity: spoolOf(c.rig), staminaMult: leg.fight?.staminaMult }, r, b, 400);
    if (res.outcome === 'landed') {
      won++;
      secs += res.seconds;
    }
  }
  return { rate: won / n, seconds: won ? secs / won : 0, ratio: bite.ratio };
}
const winRate = (legId: string, rigId: string) => fights(legId, rigId).rate;

describe('legendaries', () => {
  it('only bite when every condition holds', () => {
    const c = legendCtx('the-bishop', 'master-live');
    const leg = content.legendaries['the-bishop'];
    expect(legendaryActive(leg, c)).toBe(true);
    expect(legendaryActive(leg, { ...c, phase: 'day' })).toBe(false);
    expect(legendaryActive(leg, { ...c, month: 0 })).toBe(false);
    expect(legendaryActive(leg, { ...c, moon: 2 })).toBe(false);
    expect(legendaryActive(leg, { ...c, zoneId: 'channel' })).toBe(false);
    expect(legendaryActive(leg, { ...c, rig: rigFromPreset(content, 'deckhand-spoon') })).toBe(false);
    const iron = content.legendaries.ironjaw;
    expect(legendaryActive(iron, legendCtx('ironjaw', 'master-spoon'))).toBe(true);
    expect(legendaryActive(iron, legendCtx('ironjaw', 'master-live'))).toBe(false);
  });

  it('are just above the normal range and plausible against real records', () => {
    for (const l of Object.values(content.legendaries)) {
      const sp = content.species[l.speciesId];
      expect(l.lengthCm).toBeGreaterThan(sp.lengthCm.common * 1.5);
      expect(l.lengthCm).toBeLessThanOrEqual(sp.lengthCm.max);
      expect(weightFor(sp, l.lengthCm, null)).toBeGreaterThan(0);
    }
  });

  it('can be landed on top gear, a real fight, and not below it', () => {
    const bishop = fights('the-bishop', 'master-live');
    const ironTop = fights('ironjaw', 'master-spoon');
    const ironMid = fights('ironjaw', 'skipper-spoon');
    // A legendary is a long fight that the top rig can win (spec: 60 to 120 seconds).
    expect(bishop.ratio).toBeGreaterThan(1);
    expect(bishop.rate).toBeGreaterThan(0.25);
    expect(bishop.seconds).toBeGreaterThan(60);
    expect(bishop.seconds).toBeLessThan(120);
    expect(ironTop.rate).toBeGreaterThan(0.9);
    // Ironjaw can be beaten one tier down, by a good angler.
    expect(ironMid.ratio).toBeGreaterThan(1);
    expect(winRate('the-bishop', 'skipper')).toBeLessThan(0.02);
    expect(winRate('ironjaw', 'deckhand-spoon')).toBeLessThan(0.05);
    console.log(`legends: Bishop ${(bishop.rate * 100).toFixed(0)}% in ${bishop.seconds.toFixed(0)} s on master (ratio ${bishop.ratio.toFixed(2)}); Ironjaw ${(ironTop.rate * 100).toFixed(0)}% in ${ironTop.seconds.toFixed(0)} s on offshore, ${(ironMid.rate * 100).toFixed(0)}% in ${ironMid.seconds.toFixed(0)} s on graphite (ratio ${ironMid.ratio.toFixed(2)})`);
  });

  it('every clue can be earned, and the chain gives them', () => {
    const s = newGame(5, NOW);
    s.flags.launched = true;
    s.flags.hasRod = true;
    travel(s, ctx, 'port-esperanza');
    for (const id of ['tobias-1', 'tobias-2', 'tobias-3']) {
      acceptQuest(s, ctx, id);
      s.quests[id].state = 'ready';
      turnIn(s, ctx, id);
    }
    expect(s.clues).toContain('ironjaw:when');
    expect(s.clues).toContain('the-bishop:when');
    expect(s.journal.some((j) => j.kind === 'clue')).toBe(true);
    acceptQuest(s, ctx, 'tobias-4');
    s.quests['tobias-4'].state = 'ready';
    turnIn(s, ctx, 'tobias-4');
    expect(s.flags.bigGame).toBe(true);
    s.coins = 20000;
    buy(s, ctx, 'tackle', 'big-game-rod');
    expect(s.rig.rod).toBe('big-game-rod');
  });
});

describe('biologist', () => {
  it('appears after the skiff and pays for tagged protected releases', () => {
    const s = newGame(6, NOW);
    expect(cond(s, 'quest:alvarez-3')).toBe(false);
    s.quests['alvarez-3'] = { state: 'done', progress: 0 };
    expect(cond(s, 'quest:alvarez-3')).toBe(true);
    s.locationId = 'the-cut';
    const tarpon = (len: number) => recordCatch(s, ctx, { kind: 'fish', speciesId: 'megalops-atlanticus', lengthCm: len, weightG: 20000, grade: 'average', percentile: 0.5, ratio: 0.5, outcome: 'fight', hookWindowS: 1 }, 'blue-edge', 'rod');
    releaseFish(s, ctx, tarpon(120));
    expect(s.coins).toBe(0);
    acceptQuest(s, ctx, 'reyes-3');
    addItem(s, 'tag-kit', 1);
    releaseFish(s, ctx, tarpon(140));
    expect(s.coins).toBe(Math.round(b.economy.tagPayment * 2.4));
    expect(s.stats.tagged).toBe(1);
    expect(s.quests['reyes-3'].state).toBe('ready');
    turnIn(s, ctx, 'reyes-3');
    expect(s.clues).toContain('the-bishop:bait');
  });
});

describe('museum', () => {
  it('wings hold kept species only, and completing one pays and gives a clue', () => {
    const island = wingSpecies(content, 'castaway-island');
    expect(island).toContain('albula-vulpes');
    expect(island).not.toContain('megalops-atlanticus');
    expect(island).not.toContain('aliger-gigas');
    expect(island).not.toContain('emerita-portoricensis');
    expect(island).not.toContain('chelonia-mydas');

    const s = newGame(7, NOW);
    s.locationId = 'rocky-point';
    for (const id of island) {
      const sp = content.species[id];
      const r = recordCatch(s, ctx, { kind: 'fish', speciesId: id, lengthCm: sp.lengthCm.common, weightG: 100, grade: 'average', percentile: 0.5, ratio: 0.2, outcome: 'auto', hookWindowS: 1 }, 'shallows', 'rod');
      s.creel = [];
      keepFish(s, ctx, r);
      donate(s, ctx, id);
    }
    const w = wings(s, content).find((x) => x.regionId === 'castaway-island')!;
    expect(w.complete).toBe(true);
    expect(s.flags['wing:castaway-island']).toBe(true);
    expect(s.coins).toBe(40 * island.length);
    expect(s.clues).toContain('ironjaw:season');
    expect(badges(s, content).find((x) => x.id === 'curator')!.got).toBe(true);
    expect(donate(s, ctx, island[0])).toEqual([]);
  });

  it('the trophy wall ranks personal bests by how exceptional they are', () => {
    const s = newGame(8, NOW);
    s.locationId = 'rocky-point';
    const land = (id: string, len: number) => recordCatch(s, ctx, { kind: 'fish', speciesId: id, lengthCm: len, weightG: 100, grade: 'average', percentile: 0.5, ratio: 0.2, outcome: 'auto', hookWindowS: 1 }, 'shallows', 'rod');
    land('abudefduf-saxatilis', 22);
    land('haemulon-flavolineatum', 15);
    const wall = trophyWall(s, content);
    expect(wall[0].speciesId).toBe('abudefduf-saxatilis');
    expect(['trophy', 'record']).toContain(wall[0].grade);
    expect(badges(s, content).find((x) => x.id === 'trophy')!.got).toBe(true);
  });

  it('a grand slam is latched even after the day rolls over', () => {
    const s = newGame(9, NOW);
    s.locationId = 'lagoon';
    for (const id of ['albula-vulpes', 'trachinotus-falcatus', 'megalops-atlanticus']) {
      recordCatch(s, ctx, { kind: 'fish', speciesId: id, lengthCm: 60, weightG: 100, grade: 'average', percentile: 0.5, ratio: 0.5, outcome: 'fight', hookWindowS: 1 }, 'flats', 'rod');
    }
    expect(s.flags['badge:slam']).toBe(true);
    const later = { ...ctx, now: NOW + 3 * 86_400_000 };
    recordCatch(s, later, { kind: 'fish', speciesId: 'gerres-cinereus', lengthCm: 20, weightG: 100, grade: 'average', percentile: 0.5, ratio: 0.1, outcome: 'auto', hookWindowS: 1 }, 'flats', 'rod');
    expect(badges(s, content).find((x) => x.id === 'slam')!.got).toBe(true);
  });
});
