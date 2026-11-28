import { describe, expect, it } from 'vitest';
import { assembleContent } from '../src/content/assemble';
import { loadContentNode, readContentFiles } from '../src/content/loadNode';
import { candidatePool, finderReadout, legendaryActive, legendaryBite, spoolOf } from '../src/sim/catch';
import { simulateFight } from '../src/sim/fight';
import { makeRng } from '../src/sim/rng';
import { rigFromPreset, runSim } from '../src/sim/simulate';
import { nextWater, waterLevel, zonesAt } from '../src/sim/water';
import { type Ctx, addItem, beginCast, gather, landFish, rollBite, travel, trapHaul, trapSet } from '../src/state/actions';
import { nextGoal, stage } from '../src/state/goals';
import { acceptQuest, buy, ensureOrders, turnIn } from '../src/state/port';
import { newGame } from '../src/state/state';
import { boatTier, lockReason, locationOpen, regionOpen, waterNow, zonesNow } from '../src/state/travel';
import { wingSpecies } from '../src/state/museum';

const { content } = loadContentNode();
// Manaus is UTC-4 with no daylight saving.
const LOW = Date.parse('2026-11-20T15:00:00Z'); // 11:00 local, low water
const HIGH = Date.parse('2027-07-12T15:00:00Z'); // high water
const RISING = Date.parse('2027-02-10T15:00:00Z');
const at = (now: number): Ctx => ({ content, now, deviceTz: 'America/Chicago' });
const REGION = 'rio-negro';
const zoneIds = (locId: string, now: number) => zonesNow(at(now), locId).map((z) => z.id);

function veteran(now = LOW) {
  const s = newGame(7, now);
  s.flags.launched = true;
  s.flags.hasRod = true;
  for (const id of ['glass-rod', 'mono-line', 'steel-hook', 'skiff', 'spinning-reel']) addItem(s, id, 1);
  s.rig = { ...s.rig, rod: 'glass-rod', line: 'mono-line', hook: 'steel-hook', reel: 'spinning-reel' };
  travel(s, at(now), 'port-esperanza');
  return s;
}

describe('the flood pulse', () => {
  it('follows the Barcelos calendar: rising Jan–May, high Jun–Aug, falling Sep, low Oct–Dec', () => {
    const cal = Array.from({ length: 12 }, (_, m) => waterLevel(content, REGION, m));
    expect(cal).toEqual(['rising', 'rising', 'rising', 'rising', 'rising', 'high', 'high', 'high', 'falling', 'low', 'low', 'low']);
    expect(waterLevel(content, 'belize-cayes', 5)).toBeNull();
    expect(waterNow(at(LOW), REGION)).toBe('low');
    expect(waterNow(at(HIGH), REGION)).toBe('high');
    expect(nextWater(content, REGION, 10, ['high'])).toEqual({ month: 5, inMonths: 7 });
  });

  it('the beach exists only at low and falling water; the drowned bank only at rising and high', () => {
    expect(zoneIds('rio-channel', LOW)).toEqual(['beach', 'channel-edge', 'deep-channel']);
    expect(zoneIds('rio-channel', HIGH)).toEqual(['flooded-bank', 'channel-edge', 'deep-channel']);
    expect(zoneIds('rio-channel', RISING)).toContain('flooded-bank');
    // places outside river regions are untouched
    expect(zonesNow(at(HIGH), 'the-cut').length).toBe(content.locations['the-cut'].zones.length);
  });

  it('the flooded forest exists only while the water is up, and the canopy zone only at high water', () => {
    const s = veteran();
    addItem(s, 'river-passage', 1);
    addItem(s, 'canoe', 1);
    expect(locationOpen(s, at(LOW), 'igapo')).toBe(false);
    expect(lockReason(s, at(LOW), 'igapo')).toMatch(/April|January/);
    expect(locationOpen(s, at(HIGH), 'igapo')).toBe(true);
    expect(locationOpen(s, at(RISING), 'igapo')).toBe(true);
    expect(zoneIds('igapo', RISING)).toEqual(['forest-edge']);
    expect(zoneIds('igapo', HIGH)).toEqual(['forest-edge', 'deep-forest']);
  });

  it('every castable zone has fish at every level it exists, by day and by night', () => {
    const rigs = ['river-arrival', 'river-cut', 'river-live', 'river-jig', 'river-fruit'].map((r) => rigFromPreset(content, r));
    for (const loc of Object.values(content.locations).filter((l) => l.regionId === REGION)) {
      for (let month = 0; month < 12; month++) {
        for (const z of zonesAt(loc, waterLevel(content, REGION, month)).filter((x) => x.cast)) {
          for (const phase of ['day', 'night'] as const) {
            const any = rigs.some((rig) => candidatePool({ content, locationId: loc.id, zoneId: z.id, phase, month, rig, method: rig.method }).length > 0);
            expect(any, `${loc.id}/${z.id} month ${month} ${phase}`).toBe(true);
          }
        }
      }
    }
  });

  it('the validator rejects a place left with no bank to cast from at some water level', () => {
    const files = readContentFiles();
    const locs = files['locations/rio-negro.json'] as { id: string; zones: { id: string; water?: string[] }[] }[];
    const lagoon = locs.find((l) => l.id === 'rio-lagoon')!;
    lagoon.zones.find((z) => z.id === 'margin')!.water = ['high'];
    const { issues } = assembleContent(files);
    expect(issues.errors.some((e) => e.includes('rio-lagoon') && e.includes('minCastRange 0'))).toBe(true);
  });
});

describe('getting there', () => {
  it('boats work only in their own waters', () => {
    const s = veteran();
    expect(boatTier(s, content, 'belize-cayes')).toBe(1);
    expect(boatTier(s, content, REGION)).toBe(-1);
    addItem(s, 'canoe', 1);
    expect(boatTier(s, content, REGION)).toBe(1);
    expect(boatTier(s, content, 'belize-cayes')).toBe(1);
    addItem(s, 'riverboat', 1);
    expect(boatTier(s, content, REGION)).toBe(2);
    expect(boatTier(s, content, 'belize-cayes')).toBe(1);
  });

  it('the passage is earned from Mr Alvarez, bought at the boatyard, and opens the region both ways', () => {
    const s = veteran();
    s.coins = 5000;
    for (const id of ['alvarez-1', 'alvarez-2', 'alvarez-3', 'alvarez-4']) s.quests[id] = { state: 'done', progress: 1 };
    expect(regionOpen(s, at(LOW), REGION)).toBe(false);
    expect(buy(s, at(LOW), 'boatyard', 'river-passage')).toEqual([]); // not offered yet
    acceptQuest(s, at(LOW), 'alvarez-5');
    turnIn(s, at(LOW), 'alvarez-5');
    expect(s.flags.riverPassage).toBe(true);
    buy(s, at(LOW), 'boatyard', 'river-passage');
    expect(s.coins).toBe(2500);
    expect(regionOpen(s, at(LOW), REGION)).toBe(true);
    expect(stage(s)).toBe(5);
    travel(s, at(LOW), 'porto-mariua');
    // on arrival only the town and its waterfront are open
    expect(locationOpen(s, at(LOW), 'mariua-waterfront')).toBe(true);
    expect(locationOpen(s, at(LOW), 'rio-lagoon')).toBe(false);
    expect(nextGoal(s, content)?.where).toBe('porto-mariua');
    expect(regionOpen(s, at(LOW), 'belize-cayes')).toBe(true);
    buy(s, at(LOW), 'landing', 'canoe');
    expect(locationOpen(s, at(LOW), 'rio-lagoon')).toBe(true);
    expect(locationOpen(s, at(LOW), 'rapids')).toBe(false);
  });

  it('Porto Mariuá has its own orders board, from its own river', () => {
    const s = veteran();
    travel(s, at(LOW), 'porto-mariua');
    const list = ensureOrders(s, at(LOW), 'porto-mariua');
    expect(list.length).toBeGreaterThan(0);
    for (const o of list) expect(content.occurrences.some((x) => x.speciesId === o.speciesId && content.locations[x.locationId].regionId === REGION)).toBe(true);
  });
});

describe('new gear', () => {
  it('the fish finder is needed to find the giants of the deep holes', () => {
    const rig = rigFromPreset(content, 'river-giant');
    const base = { content, locationId: 'rio-channel', zoneId: 'deep-channel', phase: 'night' as const, month: 10, rig, method: 'bait' as const };
    expect(candidatePool(base).some((c) => c.species.id === 'brachyplatystoma-filamentosum')).toBe(false);
    expect(candidatePool({ ...base, finder: 1 }).some((c) => c.species.id === 'brachyplatystoma-filamentosum')).toBe(true);
    const r = finderReadout(base, () => false);
    expect(r.kinds).toBeGreaterThanOrEqual(3);
    expect(r.unknown).toBe(r.kinds);
    expect(finderReadout(base, () => true).unknown).toBe(0);
  });

  it('a dip net scoops cardinal tetras from the forest stream, into the bag', () => {
    const s = veteran();
    addItem(s, 'canoe', 1);
    travel(s, at(LOW), 'rio-lagoon');
    expect(gather(s, at(LOW), 'piaba').some((e) => e.type === 'toast' && /dip net/i.test(e.text))).toBe(true);
    addItem(s, 'dip-net', 1);
    gather(s, at(LOW), 'piaba');
    expect(s.inventory['cardinal-tetras']).toBe(1);
    expect(s.guide['paracheirodon-axelrodi'].cells['bait:net']).toBe('c');
  });

  it('a matapi left overnight at the waterfront brings up prawns for bait', () => {
    const s = veteran();
    addItem(s, 'matapi', 1);
    addItem(s, 'cut-bait', 1);
    travel(s, at(LOW), 'mariua-waterfront');
    trapSet(s, at(LOW), 'matapi', 'cut-bait');
    trapHaul(s, at(LOW + 9 * 3_600_000));
    expect(s.inventory['river-prawn'] ?? 0).toBeGreaterThan(0);
    expect(s.creel.length).toBe(0);
  });

  it('a sardinha caught on the rod goes into the bait bag', () => {
    const s = veteran();
    travel(s, at(LOW), 'mariua-waterfront');
    const sp = content.species['triportheus-albus'];
    landFish(s, at(LOW), { kind: 'fish', speciesId: sp.id, lengthCm: 16, weightG: 50, grade: 'average', percentile: 0.5, ratio: 0.1, outcome: 'auto', hookWindowS: 1 }, 'moorings');
    expect(s.inventory['live-sardinha']).toBe(2);
  });
});

describe('the Rio Negro region', () => {
  it('every rare and epic species has at least two obtainable rumours', () => {
    const rare = new Set(content.occurrences.filter((o) => content.locations[o.locationId].regionId === REGION && (o.rarity === 'rare' || o.rarity === 'epic')).map((o) => o.speciesId));
    expect(rare.size).toBeGreaterThanOrEqual(8);
    const obtainable = new Set(Object.values(content.quests).flatMap((q) => q.reward.rumours ?? []));
    for (const sid of rare) {
      const n = Object.values(content.rumours).filter((r) => r.speciesId === sid && obtainable.has(r.id)).length;
      expect(n, `${sid} rumours`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every researched species turns up somewhere in the region', () => {
    const ids = Object.values(content.species).filter((sp) => content.occurrences.some((o) => o.speciesId === sp.id && content.locations[o.locationId].regionId === REGION));
    expect(ids.length).toBe(42);
    expect(wingSpecies(content, REGION).length).toBeGreaterThanOrEqual(25);
  });

  it('the simulator casts in the zones the water leaves, and finds fish at the waterfront on arrival gear', () => {
    const low = runSim(content, { locationId: 'rio-channel', rigId: 'river-arrival', casts: 400, at: LOW });
    expect(low.water).toBe('low');
    expect(low.zones.map((z) => z.zoneId)).toEqual(['beach', 'channel-edge', 'deep-channel']);
    const pier = runSim(content, { locationId: 'mariua-waterfront', rigId: 'river-arrival', casts: 1500, at: LOW });
    const moorings = pier.zones.find((z) => z.zoneId === 'moorings')!;
    expect(moorings.fishBites / moorings.casts).toBeGreaterThan(0.6);
    expect(moorings.coinsPerHour).toBeGreaterThan(400);
  });

  it('a whole cast at the lagoon lands a fish through the real reducers', () => {
    const s = veteran();
    addItem(s, 'canoe', 1);
    addItem(s, 'earthworm', 40);
    s.rig = { ...s.rig, hook: 'steel-hook-small', bait: 'earthworm' };
    addItem(s, 'steel-hook-small', 5);
    travel(s, at(LOW), 'rio-lagoon');
    let landed = 0;
    for (let i = 0; i < 60 && !landed; i++) {
      beginCast(s, at(LOW), 'margin');
      const bite = rollBite(s, at(LOW), 'margin');
      if (bite.kind === 'fish' && bite.outcome !== 'overmatched') {
        landFish(s, at(LOW), bite, 'margin');
        landed++;
      }
    }
    expect(landed).toBe(1);
    expect(Object.keys(s.guide).some((id) => content.occByLocation['rio-lagoon'].some((o) => o.speciesId === id))).toBe(true);
  });
});

describe('Old Gold', () => {
  it('waits under the fallen tree at the lagoon mouth, by day, at low water, for a popper', () => {
    const leg = content.legendaries['old-gold'];
    const rig = rigFromPreset(content, 'river-popper');
    const c = { content, locationId: 'rio-lagoon', zoneId: 'lagoon-mouth', phase: 'day' as const, month: 9, rig, method: 'lure' as const };
    expect(legendaryActive(leg, c)).toBe(true);
    expect(legendaryActive(leg, { ...c, phase: 'dawn' })).toBe(false);
    expect(legendaryActive(leg, { ...c, month: 4 })).toBe(false);
    expect(legendaryActive(leg, { ...c, rig: rigFromPreset(content, 'river-prop') })).toBe(false);
    // the zone he lives in exists at the water his season names
    for (const m of leg.spawn.months) expect(zonesAt(content.locations['rio-lagoon'], waterLevel(content, REGION, m)).some((z) => z.id === 'lagoon-mouth')).toBe(true);
    // and the field guide agrees with his clues: speckled peacock bass at the mouth by day, strongest in his months
    const occ = content.occByLocation['rio-lagoon'].find((o) => o.speciesId === 'cichla-temensis' && o.zones.includes('lagoon-mouth'))!;
    expect(occ.phaseMod.day).toBeGreaterThanOrEqual(occ.phaseMod.dawn);
    for (const m of leg.spawn.months) expect(occ.monthMod[m]).toBeGreaterThan(1);
  });

  it('is a real fight on the graphite popper rig and cannot be landed on lighter gear', () => {
    const leg = content.legendaries['old-gold'];
    const fight = (rigId: string) => {
      const rig = rigFromPreset(content, rigId);
      const bite = legendaryBite(leg, { content, locationId: 'rio-lagoon', zoneId: 'lagoon-mouth', phase: 'day', month: 9, rig, method: 'lure' });
      const r = makeRng(9);
      let won = 0;
      let secs = 0;
      for (let i = 0; i < 200; i++) {
        const res = simulateFight({ species: content.species[leg.speciesId], ratio: bite.ratio, startDist: 0.8, greenBonus: rig.reel?.reel?.greenBonus ?? 0, capacity: spoolOf(rig), staminaMult: leg.fight?.staminaMult }, r, content.balance, 400);
        if (res.outcome === 'landed') {
          won++;
          secs += res.seconds;
        }
      }
      return { rate: won / 200, seconds: won ? secs / won : 0 };
    };
    const top = fight('river-popper');
    expect(top.rate).toBeGreaterThan(0.8);
    expect(top.seconds).toBeGreaterThan(45);
    expect(fight('river-jig').rate).toBe(0);
  });
});
