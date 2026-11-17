import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import { type Ctx, addItem, recordCatch, keepFish, travel } from '../src/state/actions';
import { nextGoal } from '../src/state/goals';
import { acceptQuest, buy, currentQuest, ensureOrders, fillOrder, questReady, sellAllFish, sellFish, sellItem, sellable, turnIn } from '../src/state/port';
import { newGame } from '../src/state/state';
import { runSim } from '../src/sim/simulate';
import { weightFor } from '../src/sim/catch';

const { content } = loadContentNode();
const NOW = Date.parse('2027-03-10T15:00:00Z');
const ctx: Ctx = { content, now: NOW, deviceTz: 'America/Chicago' };

function arrive() {
  const s = newGame(11, NOW);
  s.flags.launched = true;
  s.flags.hasRod = true;
  for (const id of ['bamboo-rod', 'braided-line', 'bone-hook', 'raft']) addItem(s, id, 1);
  s.rig = { ...s.rig, rod: 'bamboo-rod', line: 'braided-line', hook: 'bone-hook' };
  travel(s, ctx, 'port-esperanza');
  return s;
}

function land(s: ReturnType<typeof newGame>, speciesId: string, lengthCm: number, zone = 'pilings') {
  const sp = content.species[speciesId];
  const r = recordCatch(s, ctx, { kind: 'fish', speciesId, lengthCm, weightG: weightFor(sp, lengthCm, null), grade: 'average', percentile: 0.5, ratio: 0.5, outcome: 'fight', hookWindowS: 1 }, zone, 'rod');
  keepFish(s, ctx, r);
  return r;
}

describe('first port', () => {
  it('every rare and epic species in the region has at least two obtainable rumours', () => {
    const region = 'belize-cayes';
    const rare = new Set(content.occurrences.filter((o) => content.locations[o.locationId].regionId === region && (o.rarity === 'rare' || o.rarity === 'epic')).map((o) => o.speciesId));
    const obtainable = new Set([...content.pages.flatMap((p) => p.rumours), ...Object.values(content.quests).flatMap((q) => q.reward.rumours ?? [])]);
    for (const sid of rare) {
      const n = Object.values(content.rumours).filter((r) => r.speciesId === sid && obtainable.has(r.id)).length;
      expect(n, `${sid} rumours`).toBeGreaterThanOrEqual(2);
    }
  });

  it('the port runs on its own clock, not the phone’s', () => {
    const s = arrive();
    // 15:00 UTC is 09:00 in Belize whatever zone the device is in
    const g1 = { ...ctx, deviceTz: 'Asia/Tokyo' };
    travel(s, g1, 'town-pier');
    expect(content.locations['town-pier'].tz).toBe('America/Belize');
  });

  it('sells fish and goods for coins', () => {
    const s = arrive();
    land(s, 'lutjanus-griseus', 32);
    land(s, 'haemulon-plumierii', 26);
    addItem(s, 'sea-glass', 2);
    expect(sellable(s, content)).toContain('sea-glass');
    sellFish(s, ctx, s.creel[0].uid);
    expect(s.coins).toBe(content.species['lutjanus-griseus'].baseValue);
    sellAllFish(s, ctx);
    expect(s.creel).toHaveLength(0);
    sellItem(s, ctx, 'sea-glass', 2);
    expect(s.coins).toBe(9 + 5 + 24);
    expect(s.stats.coinsEarned).toBe(s.coins);
  });

  it('shops take coins, refuse the poor, and put upgrades on the rig', () => {
    const s = arrive();
    expect(buy(s, ctx, 'tackle', 'glass-rod').some((e) => e.type === 'toast')).toBe(true);
    expect(s.inventory['glass-rod']).toBeUndefined();
    s.coins = 1000;
    buy(s, ctx, 'tackle', 'glass-rod');
    expect(s.rig.rod).toBe('glass-rod');
    expect(s.coins).toBe(1000 - 420);
    buy(s, ctx, 'tackle', 'glass-rod');
    expect(s.inventory['glass-rod']).toBe(1);
    buy(s, ctx, 'tackle', 'shrimp', 5);
    expect(s.inventory.shrimp).toBe(5);
    expect(s.rig.bait).toBe('shrimp');
  });

  it('the orders board is stable for a day, changes the next, and pays over market', () => {
    const s = arrive();
    const a = ensureOrders(s, ctx, 'port-esperanza').map((o) => o.speciesId);
    expect(a).toHaveLength(content.balance.economy.ordersPerDay);
    expect(ensureOrders(s, ctx, 'port-esperanza').map((o) => o.speciesId)).toEqual(a);
    const o = s.orders!.list[0];
    const sp = content.species[o.speciesId];
    expect(o.pay).toBeGreaterThan(sp.baseValue);
    expect(fillOrder(s, ctx, o.id).some((e) => e.type === 'toast' && e.tone === 'warn')).toBe(true);
    land(s, o.speciesId, o.minCm + 2);
    fillOrder(s, ctx, o.id);
    expect(o.filled).toBe(true);
    expect(s.coins).toBe(o.pay);
    const tomorrow = { ...ctx, now: NOW + 26 * 3600_000 };
    ensureOrders(s, tomorrow, 'port-esperanza');
    expect(s.orders!.list.every((x) => !x.filled)).toBe(true);
  });

  it('quest chains run in order: accept, progress, report, reward', () => {
    const s = arrive();
    expect(nextGoal(s, content)?.where).toBe('port-esperanza');
    const first = currentQuest(s, content, 'alvarez')!;
    expect(first.quest.id).toBe('alvarez-1');
    acceptQuest(s, ctx, 'alvarez-1');
    travel(s, ctx, 'town-pier');
    for (let i = 0; i < 5; i++) land(s, 'haemulon-plumierii', 24);
    expect(s.quests['alvarez-1'].state).toBe('ready');
    expect(nextGoal(s, content)?.text).toMatch(/Alvarez/);
    const before = s.coins;
    turnIn(s, ctx, 'alvarez-1');
    expect(s.coins).toBe(before + 40);
    expect(s.guide['centropomus-undecimalis'].rumours).toContain('snook-lights');
    expect(s.guide['centropomus-undecimalis'].cells['phase:night']).toBe('r');
    expect(currentQuest(s, content, 'alvarez')!.quest.id).toBe('alvarez-2');

    acceptQuest(s, ctx, 'alvarez-2');
    expect(questReady(s, content.quests['alvarez-2'])).toBe(false);
    s.coins = 2000;
    buy(s, ctx, 'tackle', 'mono-line');
    expect(questReady(s, content.quests['alvarez-2'])).toBe(true);
    turnIn(s, ctx, 'alvarez-2');
    acceptQuest(s, ctx, 'alvarez-3');
    buy(s, ctx, 'boatyard', 'skiff');
    turnIn(s, ctx, 'alvarez-3');
    acceptQuest(s, ctx, 'alvarez-4');
    travel(s, ctx, 'beach');
    expect(s.quests['alvarez-4'].state).toBe('ready');

    // deliverFish takes the fish
    acceptQuest(s, ctx, 'tobias-1');
    expect(questReady(s, content.quests['tobias-1'])).toBe(false);
    land(s, 'ocyurus-chrysurus', 36, 'sand');
    const n = s.creel.length;
    turnIn(s, ctx, 'tobias-1');
    expect(s.creel.length).toBe(n - 1);
    expect(s.journal.some((j) => j.kind === 'quest')).toBe(true);
  });

  it('gates the water by boat and rod', () => {
    for (const id of ['mangrove-creek', 'patch-reef', 'the-cut']) expect(content.locations[id].unlock).toEqual([{ type: 'boat', tier: 1 }]);
    expect(content.locations['town-pier'].unlock).toEqual([]);
    const at = Date.parse('2027-01-15T16:00:00Z');
    const reef = (rig: string) => runSim(content, { locationId: 'patch-reef', rigId: rig, casts: 500, at }).zones.map((z) => z.reachable);
    expect(reef('arrival')).toEqual([true, true, false]);
    expect(reef('deckhand')).toEqual([true, true, false]);
    expect(reef('skipper')).toEqual([true, true, true]);
    const cut = runSim(content, { locationId: 'the-cut', rigId: 'skipper', casts: 200, at });
    expect(cut.zones[2].reachable).toBe(false); // blue water: a wall for a bigger boat
  });

  it('a creek tarpon is winnable on shop gear', () => {
    const dawn = Date.parse('2027-06-15T11:45:00Z');
    const r = runSim(content, { locationId: 'mangrove-creek', rigId: 'skipper-plug', casts: 8000, at: dawn, zoneId: 'creek' });
    const tarpon = r.zones[0].rows.find((x) => x.speciesId === 'megalops-atlanticus');
    expect(tarpon).toBeDefined();
    expect(tarpon!.landed).toBeGreaterThan(0);
  });
});
