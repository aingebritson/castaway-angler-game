/**
 * A scripted castaway plays from waking up to launching the raft, through the
 * real reducers and the real content. If this passes, there is a way off the
 * island that never gets stuck.
 */
import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import {
  type Ctx, beginCast, cleanFish, craft, gather, has, keepFish, landFish, launchRaft, loseFish, pickup, rackAdd, rackCollect, raftStatus,
  recordCatch, rollBite, speciesCaught, stolenBait, landJunk, sunAt, travel, trapHaul, trapSet, equip,
} from '../src/state/actions';
import { nextGoal } from '../src/state/goals';
import { type GameState, decodeSave, encodeSave, migrate, newGame } from '../src/state/state';
import { craftCheck } from '../src/sim/world';

const { content } = loadContentNode();
const MIN = 60_000;

const SOURCE: Record<string, [string, string]> = {
  stone: ['rocky-point', 'stones'], vine: ['grove', 'vines'], coconut: ['grove', 'coconuts'], 'palm-frond': ['grove', 'fronds'],
  driftwood: ['beach', 'driftwood'], shell: ['beach', 'shells'], feather: ['beach', 'feathers'], bamboo: ['grove', 'bamboo'],
  'sand-flea': ['beach', 'swash'], rope: ['beach', 'wrack'], canvas: ['beach', 'wrack'], plank: ['beach', 'wrack'],
};

class Castaway {
  s: GameState;
  now: number;
  casts = 0;
  lostFights = 0;
  constructor(seed: number, start: string) {
    this.now = Date.parse(start);
    this.s = newGame(seed, this.now);
  }
  get ctx(): Ctx {
    return { content, now: this.now, deviceTz: 'America/Belize' };
  }
  wait(min: number) {
    this.now += min * MIN;
  }
  go(loc: string) {
    if (this.s.locationId !== loc) travel(this.s, this.ctx, loc);
    this.wait(0.5);
  }
  /** Gather until we hold `qty` of an item, waiting for regrowth when a node runs dry. */
  ensure(item: string, qty: number) {
    let guard = 0;
    while ((this.s.inventory[item] ?? 0) < qty) {
      if (guard++ > 400) throw new Error(`could not gather ${item}`);
      if (item === 'cordage') { this.make('cordage'); continue; }
      if (item === 'fish-bone' || item === 'cut-bait') { this.cleanOne(); continue; }
      if (item === 'bone-hook') { this.make('bone-hook'); continue; }
      const src = SOURCE[item];
      if (!src) throw new Error(`no source for ${item}`);
      this.go(src[0]);
      const before = JSON.stringify(this.s.inventory);
      gather(this.s, this.ctx, src[1]);
      this.wait(0.1);
      if (JSON.stringify(this.s.inventory) === before) this.wait(src[1] === 'wrack' ? 24 * 60 : 10);
    }
  }
  make(recipeId: string) {
    const r = content.recipes[recipeId];
    for (const t of [...r.tools, ...(r.station ? [r.station] : [])]) if (!has(this.s, t)) this.make(t);
    for (const i of r.inputs) this.ensure(i.item, i.qty + (r.inputs.some((x) => x.item === i.item) ? 0 : 0));
    // gathering for one input may have consumed another (cordage eats coconuts); top up until it all holds
    let guard = 0;
    while (!craftCheck(r, this.s.inventory).ok) {
      if (guard++ > 20) throw new Error(`cannot assemble ${recipeId}`);
      for (const i of r.inputs) this.ensure(i.item, i.qty);
    }
    this.go('camp');
    craft(this.s, this.ctx, recipeId);
    expect(has(this.s, r.output.item), `crafted ${recipeId}`).toBe(true);
  }
  cleanOne() {
    if (!has(this.s, 'stone-knife')) this.make('stone-knife');
    if (!this.s.creel.some((f) => content.species[f.speciesId].kind === 'fish')) this.fish('rocky-point', 'shallows', () => this.s.creel.length > 0);
    const f = this.s.creel.find((x) => content.species[x.speciesId].kind === 'fish')!;
    cleanFish(this.s, this.ctx, f.uid);
  }
  /** Cast until `done`. Fights are won unless the fish is overmatched. Keeps what it lands. */
  fish(loc: string, zone: string, done: () => boolean, max = 400) {
    for (let i = 0; i < max && !done(); i++) {
      if (!this.s.rig.hook || !has(this.s, this.s.rig.hook)) this.make('shell-hook');
      if (this.s.rig.method === 'bait' && (!this.s.rig.bait || !has(this.s, this.s.rig.bait))) {
        this.ensure('sand-flea', 4);
        equip(this.s, this.ctx, 'bait', 'sand-flea');
      }
      this.go(loc);
      const plan = beginCast(this.s, this.ctx, zone);
      expect(plan).not.toBeNull();
      this.casts++;
      this.wait(0.4);
      const bite = rollBite(this.s, this.ctx, zone);
      if (bite.kind === 'junk') landJunk(this.s, this.ctx, bite.itemId);
      else if (bite.kind === 'stolen') stolenBait(this.s, this.ctx);
      else if (bite.kind === 'fish') {
        if (bite.outcome === 'overmatched') {
          this.lostFights++;
          loseFish(this.s, this.ctx, bite, zone, 'snapped');
        } else {
          const r = landFish(this.s, this.ctx, bite, zone);
          if (this.s.creel.length < 10) keepFish(this.s, this.ctx, r);
        }
      }
    }
    expect(done(), `fishing ${loc}/${zone} reached its goal`).toBe(true);
  }
  untilPhase(phase: string) {
    for (let i = 0; i < 24 * 12 && sunAt(this.ctx, 'beach').phase !== phase; i++) this.wait(5);
  }
}

describe('castaway playthrough', () => {
  it('gets from waking up to launching the raft, with a goal at every step', () => {
    const p = new Castaway(20261116, '2027-02-01T14:00:00Z');
    const s = p.s;
    const goals = new Set<string>();
    const note = () => {
      const g = nextGoal(s, content);
      if (g) goals.add(g.text);
      return g;
    };

    expect(note()?.where).toBe('beach');
    pickup(s, p.ctx, 'start-rod');
    expect(s.rig.rod).toBe('old-rod');
    expect(note()?.text).toMatch(/Bait/);
    p.ensure('sand-flea', 5);
    expect(s.rig.bait).toBe('sand-flea');
    expect(note()?.where).toBe('rocky-point');

    // Stage 0: first fish.
    p.fish('rocky-point', 'shallows', () => s.creel.length >= 3);
    expect(s.stats.catches).toBeGreaterThanOrEqual(3);
    note();

    // Stage 1: toolmaker.
    for (const r of ['hammerstone', 'stone-knife', 'cordage', 'bone-hook', 'coconut-float', 'stone-sinker', 'campfire']) {
      p.make(r);
      note();
    }
    // Stage 2: angler.
    for (const r of ['bamboo-rod', 'braided-line', 'feather-lure', 'torch', 'woven-trap', 'bait-basket', 'drying-rack', 'bone-needle']) {
      p.make(r);
      note();
    }
    expect(s.rig.rod).toBe('bamboo-rod');
    expect(s.rig.line).toBe('braided-line');

    // The trap, overnight.
    p.go('rocky-point');
    p.ensure('cut-bait', 1);
    p.go('rocky-point');
    trapSet(s, p.ctx, 'woven-trap', 'cut-bait');
    expect(s.traps).toHaveLength(1);

    // Night fishing with the torch finds the night shift.
    p.untilPhase('night');
    equip(s, p.ctx, 'hook', has(s, 'shell-hook') ? 'shell-hook' : s.rig.hook);
    p.ensure('sand-flea', 6);
    equip(s, p.ctx, 'bait', 'sand-flea');
    if (!has(s, 'shell-hook')) p.make('shell-hook');
    equip(s, p.ctx, 'hook', 'shell-hook');
    p.fish('rocky-point', 'shallows', () => s.guide['holocentrus-adscensionis']?.state === 'caught', 300);

    p.untilPhase('day');
    p.go('rocky-point');
    const haul = trapHaul(s, p.ctx);
    expect(haul.some((e) => e.type === 'haul')).toBe(true);
    expect(has(s, 'woven-trap')).toBe(true);

    // Eight kinds, then the bearing arrives by bottle.
    p.fish('rocky-point', 'shallows', () => speciesCaught(s, content) >= content.balance.bearing.speciesNeeded, 600);
    p.fish('rocky-point', 'shallows', () => !!s.flags.bearing, 600);
    expect(s.pagesFound).toBe(content.pages.length);
    note();

    // Provisions: smoke five fish of three kinds.
    const kinds = () => new Set([...s.larder, ...s.rack.map((r) => r.fish)].map((f) => f.speciesId)).size;
    for (let round = 0; round < 12 && (s.larder.length < 5 || kinds() < 3); round++) {
      p.fish('rocky-point', 'shallows', () => s.creel.filter((f) => content.species[f.speciesId].kind === 'fish').length >= 3);
      p.go('camp');
      for (const f of [...s.creel]) if (s.rack.length < content.balance.camp.rackSlots) rackAdd(s, p.ctx, f.uid);
      p.wait(content.balance.camp.smokeMin + 1);
      rackCollect(s, p.ctx);
    }
    expect(s.larder.length).toBeGreaterThanOrEqual(5);

    for (const r of ['raft-hull', 'raft-lashings', 'raft-mast', 'raft-sail', 'raft-oar', 'provisions']) {
      p.make(r);
      note();
    }
    expect(raftStatus(s).ready).toBe(true);
    expect(note()?.text).toMatch(/ready/);
    const events = launchRaft(s, p.ctx);
    expect(events.some((e) => e.type === 'ending')).toBe(true);
    expect(s.flags.launched).toBe(true);
    expect(nextGoal(s, content)?.where).toBe('port-esperanza');

    // The journal wrote itself along the way.
    const kindsLogged = new Set(s.journal.map((j) => j.kind));
    for (const k of ['story', 'catch', 'page', 'rumour', 'craft', 'trap', 'travel']) expect(kindsLogged.has(k as never), `journal has ${k}`).toBe(true);
    expect(goals.size).toBeGreaterThan(10);
    console.log(`playthrough: ${p.casts} casts, ${s.stats.catches} catches, ${p.lostFights} overmatched, ${speciesCaught(s, content)} species, ${goals.size} distinct goals`);
  });

  it('hand-gathered bait creatures are recorded but do not count as catches', () => {
    const p = new Castaway(5, '2027-02-01T14:00:00Z');
    gather(p.s, p.ctx, 'swash');
    expect(p.s.guide['emerita-portoricensis']?.state).toBe('caught');
    expect(p.s.stats.catches).toBe(0);
    expect(p.s.inventory['sand-flea']).toBe(1);
  });

  it('release-only animals cannot be kept', () => {
    const p = new Castaway(6, '2027-02-01T14:00:00Z');
    pickup(p.s, p.ctx, 'start-rod');
    const sp = content.species['megalops-atlanticus'];
    const r = recordCatch(p.s, p.ctx, { kind: 'fish', speciesId: sp.id, lengthCm: 120, weightG: 12000, grade: 'average', percentile: 0.5, ratio: 0.5, outcome: 'fight', hookWindowS: 1 }, 'channel', 'rod');
    expect(r.releaseOnly).toBe(true);
    keepFish(p.s, p.ctx, r);
    expect(p.s.creel).toHaveLength(0);
    expect(p.s.guide[sp.id].released).toBe(1);
  });

  it('save codes round-trip and old saves migrate', () => {
    const p = new Castaway(7, '2027-02-01T14:00:00Z');
    pickup(p.s, p.ctx, 'start-rod');
    p.ensure('sand-flea', 2);
    const back = decodeSave(encodeSave(p.s), p.now);
    expect(back).toEqual(p.s);
    expect(() => decodeSave('nonsense', p.now)).toThrow();
    const old = { ...structuredClone(p.s), v: 1 } as Record<string, unknown>;
    delete old.larder;
    delete old.quests;
    const up = migrate(old, p.now);
    expect(up.larder).toEqual([]);
    expect(up.inventory['old-rod']).toBe(1);
    expect(() => migrate({ v: 999 }, p.now)).toThrow();
  });
});
