/**
 * Port rules: the market, shops, the orders board and people's errands.
 * Coins come from the catch and go into gear that opens new water.
 */
import type { Content } from '../content/assemble';
import type { Quest } from '../content/schema';
import { fishValue } from '../sim/catch';
import { range, weighted } from '../sim/rng';
import { localTime } from '../sim/time';
import { dailySeed } from '../sim/world';
import { type Ctx, type GameEvent, addItem, applyRumour, has, log, takeItem } from './actions';
import type { GameState, KeptFish, OrderSave, QuestSave } from './state';

const toast = (text: string, glyph?: string, tone: 'good' | 'warn' | 'info' = 'info'): GameEvent => ({ type: 'toast', text, glyph, tone });

function earn(s: GameState, coins: number): void {
  s.coins += coins;
  s.stats.coinsEarned += coins;
}

export function fishPrice(content: Content, f: KeptFish): number {
  return fishValue(content.species[f.speciesId], f.grade, content.balance, !!f.smoked);
}

export function sellFish(s: GameState, ctx: Ctx, uid: number): GameEvent[] {
  for (const list of [s.creel, s.larder]) {
    const i = list.findIndex((f) => f.uid === uid);
    if (i < 0) continue;
    const [f] = list.splice(i, 1);
    earn(s, fishPrice(ctx.content, f));
    return [{ type: 'sfx', id: 'coin' }];
  }
  return [];
}

export function sellAllFish(s: GameState, ctx: Ctx): GameEvent[] {
  const total = [...s.creel, ...s.larder].reduce((t, f) => t + fishPrice(ctx.content, f), 0);
  if (!total) return [toast('Nothing to sell.', '🐟')];
  const n = s.creel.length + s.larder.length;
  s.creel = [];
  s.larder = [];
  earn(s, total);
  return [{ type: 'sfx', id: 'coin' }, toast(`Sold ${n} fish for ${total} coins.`, '◉', 'good')];
}

/** Things the market will buy: goods and spare materials, never gear. */
export function sellable(s: GameState, content: Content): string[] {
  return Object.keys(s.inventory).filter((id) => {
    const it = content.items[id];
    return s.inventory[id] > 0 && it?.value != null && it.value > 0 && (it.kind === 'goods' || it.kind === 'material');
  });
}

export function sellItem(s: GameState, ctx: Ctx, itemId: string, qty: number): GameEvent[] {
  const it = ctx.content.items[itemId];
  const n = Math.min(qty, s.inventory[itemId] ?? 0);
  if (!it?.value || n <= 0) return [];
  takeItem(s, itemId, n);
  earn(s, it.value * n);
  return [{ type: 'sfx', id: 'coin' }];
}

export function buy(s: GameState, ctx: Ctx, shopId: string, itemId: string, qty = 1): GameEvent[] {
  const entry = ctx.content.shops[shopId]?.stock.find((e) => e.item === itemId);
  if (!entry) return [];
  if (entry.once && has(s, itemId)) return [toast('You already own one.', '✋')];
  const cost = entry.price * qty;
  if (s.coins < cost) return [toast(`Not enough coins. It costs ${cost}.`, '◉', 'warn')];
  s.coins -= cost;
  const it = ctx.content.items[itemId];
  const first = !s.everHeld[itemId];
  addItem(s, itemId, qty);
  // put new gear straight on the rig when it is a plain upgrade
  const cur = (slot: 'rod' | 'line' | 'reel') => (s.rig[slot] ? ctx.content.items[s.rig[slot]!] : null);
  if (it.rod && (cur('rod')?.rod?.tier ?? -1) < it.rod.tier) s.rig.rod = itemId;
  if (it.line && (cur('line')?.line?.strength ?? -1) < it.line.strength) s.rig.line = itemId;
  if (it.reel && !cur('reel')) s.rig.reel = itemId;
  if (it.hook && (!s.rig.hook || !has(s, s.rig.hook))) s.rig.hook = itemId;
  if (it.bait && (!s.rig.bait || !has(s, s.rig.bait))) s.rig.bait = itemId;
  if (it.lure && (!s.rig.lure || !has(s, s.rig.lure))) s.rig.lure = itemId;
  if (first && it.boat) log(s, ctx, 'story', `Bought the ${it.name.toLowerCase()}. ${it.desc}`);
  else if (first && (it.rod || it.line || it.reel)) log(s, ctx, 'craft', `Bought a ${it.name.toLowerCase()}. ${it.desc}`);
  return [{ type: 'sfx', id: 'coin' }, { type: 'gain', itemId, qty }];
}

// ---------- orders board ----------

/** Today's orders at a port: a few requests that pay two to three times market price. */
export function ensureOrders(s: GameState, ctx: Ctx, portId: string): OrderSave[] {
  const port = ctx.content.locations[portId];
  const day = localTime(ctx.now, port.tz === 'device' ? ctx.deviceTz : port.tz).dayKey;
  if (s.orders && s.orders.day === day && s.orders.portId === portId) return s.orders.list;
  const rng = dailySeed(s.seed, portId, day);
  const b = ctx.content.balance;
  const seen = new Set<string>();
  const pool = ctx.content.occurrences.filter((o) => {
    const sp = ctx.content.species[o.speciesId];
    if (ctx.content.locations[o.locationId]?.regionId !== port.regionId) return false;
    if (!sp || sp.conservation.releaseOnly || sp.baseValue < 4 || sp.gathersAs || o.rarity === 'epic') return false;
    if (o.minGear?.rodTier != null && o.minGear.rodTier > 3) return false;
    if (seen.has(o.speciesId)) return false;
    seen.add(o.speciesId);
    return true;
  });
  const list: OrderSave[] = [];
  for (let i = 0; i < b.economy.ordersPerDay && pool.length; i++) {
    const o = weighted(rng, pool, (x) => (x.rarity === 'rare' ? 1 : 3));
    if (!o) break;
    pool.splice(pool.indexOf(o), 1);
    const sp = ctx.content.species[o.speciesId];
    const minCm = Math.round(sp.lengthCm.common * range(rng, 0.8, 1.1));
    const pay = Math.round(sp.baseValue * range(rng, b.economy.orderMult[0], b.economy.orderMult[1]) * Math.pow(minCm / sp.lengthCm.common, 1.5)) + 5;
    list.push({ id: `${day}-${i}`, speciesId: sp.id, minCm, pay, filled: false });
  }
  s.orders = { day, portId, list };
  return list;
}

export function orderMatch(s: GameState, o: OrderSave): KeptFish | undefined {
  return s.creel.filter((f) => f.speciesId === o.speciesId && f.lengthCm >= o.minCm).sort((a, b) => a.lengthCm - b.lengthCm)[0];
}

export function fillOrder(s: GameState, ctx: Ctx, orderId: string): GameEvent[] {
  const o = s.orders?.list.find((x) => x.id === orderId);
  if (!o || o.filled) return [];
  const f = orderMatch(s, o);
  if (!f) return [toast('Nothing in the basket fits that order.', '📋', 'warn')];
  s.creel = s.creel.filter((x) => x.uid !== f.uid);
  o.filled = true;
  earn(s, o.pay);
  return [{ type: 'sfx', id: 'coin' }, toast(`Order filled: ${o.pay} coins.`, '◉', 'good')];
}

// ---------- people and errands ----------

export function currentQuest(s: GameState, content: Content, personId: string): { quest: Quest; save: QuestSave | undefined } | null {
  for (const q of content.questsByPerson[personId] ?? []) {
    const save = s.quests[q.id];
    if (save?.state !== 'done') return { quest: q, save };
  }
  return null;
}

export function goalCount(q: Quest): number {
  const g = q.goal;
  return 'count' in g ? g.count : 'qty' in g ? g.qty : 1;
}

function deliverable(s: GameState, q: Quest): KeptFish[] {
  const g = q.goal;
  if (g.type !== 'deliverFish') return [];
  return [...s.creel, ...s.larder].filter((f) => (!g.speciesId || f.speciesId === g.speciesId) && (!g.minCm || f.lengthCm >= g.minCm)).slice(0, g.count);
}

/** Can this errand be handed in right now? */
export function questReady(s: GameState, q: Quest): boolean {
  const save = s.quests[q.id];
  if (!save || save.state === 'done') return false;
  if (save.state === 'ready') return true;
  const g = q.goal;
  if (g.type === 'have') return has(s, g.item) || !!s.everHeld[g.item];
  if (g.type === 'deliver') return (s.inventory[g.item] ?? 0) >= g.qty;
  if (g.type === 'deliverFish') return deliverable(s, q).length >= g.count;
  return false;
}

export function acceptQuest(s: GameState, ctx: Ctx, questId: string): GameEvent[] {
  const q = ctx.content.quests[questId];
  if (!q || s.quests[questId]) return [];
  s.quests[questId] = { state: 'active', progress: 0 };
  log(s, ctx, 'quest', `${ctx.content.people[q.personId].name}: “${q.title}”. ${q.progressText}.`);
  return [{ type: 'sfx', id: 'page' }];
}

export function turnIn(s: GameState, ctx: Ctx, questId: string): GameEvent[] {
  const q = ctx.content.quests[questId];
  if (!q || !questReady(s, q)) return [];
  const g = q.goal;
  if (g.type === 'deliver') takeItem(s, g.item, g.qty);
  if (g.type === 'deliverFish') {
    const give = new Set(deliverable(s, q).map((f) => f.uid));
    s.creel = s.creel.filter((f) => !give.has(f.uid));
    s.larder = s.larder.filter((f) => !give.has(f.uid));
  }
  s.quests[questId] = { ...s.quests[questId], state: 'done' };
  const events: GameEvent[] = [{ type: 'sfx', id: 'discover' }];
  const r = q.reward;
  const who = ctx.content.people[q.personId].name;
  if (r.coins) {
    earn(s, r.coins);
    events.push(toast(`${who} pays you ${r.coins} coins.`, '◉', 'good'));
  }
  for (const i of r.items ?? []) {
    addItem(s, i.item, i.qty);
    events.push({ type: 'gain', itemId: i.item, qty: i.qty });
  }
  for (const id of r.rumours ?? []) applyRumour(s, ctx, id);
  if (r.rumours?.length) events.push(toast(`${r.rumours.length} rumour${r.rumours.length > 1 ? 's' : ''} noted in the field guide.`, '💬', 'good'));
  for (const id of r.recipes ?? []) if (!s.recipesKnown.includes(id)) s.recipesKnown.push(id);
  for (const f of r.flags ?? []) s.flags[f] = true;
  if (r.clue) {
    s.clues.push(r.clue);
    log(s, ctx, 'clue', r.clue);
    events.push(toast('A legend, written in the log.', '✨', 'good'));
  }
  log(s, ctx, 'quest', `“${q.title}” done. ${who}: “${q.done}”`);
  return events;
}
