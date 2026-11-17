import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import { type Ctx, beginCast, gather, landFish, pickup, rollBite, travel } from '../src/state/actions';
import { newGame } from '../src/state/state';
import { type CoachView, coachStep, focusHotspots, navHidden } from '../src/state/tutorial';

const { content } = loadContentNode();
const ctx: Ctx = { content, now: Date.parse('2027-02-01T18:00:00Z'), deviceTz: 'America/Belize' };
const v = (o: Partial<CoachView> = {}): CoachView => ({ phase: 'idle', panel: null, card: false, ...o });

describe('opening walkthrough', () => {
  it('leads from waking up to the first fish, one thing at a time', () => {
    const s = newGame(1, ctx.now);
    expect(coachStep(s, v())).toBe('intro');
    expect(navHidden('intro')).toBe(true);
    s.flags.introSeen = true;
    expect(coachStep(s, v())).toBe('rod');
    expect(focusHotspots('rod')).toEqual(['old-rod']);
    pickup(s, ctx, 'start-rod');
    expect(coachStep(s, v())).toBe('bait');
    expect(navHidden('bait')).toBe(true);
    for (let i = 0; i < 3; i++) gather(s, ctx, 'swash');
    expect(s.inventory['sand-flea']).toBe(3);
    expect(coachStep(s, v())).toBe('map');
    expect(navHidden('map')).toBe(false);
    expect(coachStep(s, v({ panel: 'map' }))).toBe('map-pin');
    travel(s, ctx, 'rocky-point');
    expect(coachStep(s, v())).toBe('cast');
    expect(coachStep(s, v({ phase: 'waiting' }))).toBe('wait');
    expect(coachStep(s, v({ phase: 'bite' }))).toBe('bite');
    expect(coachStep(s, v({ phase: 'fight' }))).toBeNull();
    expect(coachStep(s, v({ card: true }))).toBeNull();
  });

  it('the first cast is quick and always a landable fish with a wide window', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame(seed, ctx.now);
      pickup(s, ctx, 'start-rod');
      gather(s, ctx, 'swash');
      travel(s, ctx, 'rocky-point');
      const plan = beginCast(s, ctx, 'shallows')!;
      expect(plan.waitS).toBeLessThanOrEqual(4);
      expect(plan.nibbles).toBeGreaterThanOrEqual(1);
      const bite = rollBite(s, ctx, 'shallows');
      expect(bite.kind, `seed ${seed}`).toBe('fish');
      if (bite.kind === 'fish') {
        expect(bite.outcome).not.toBe('overmatched');
        expect(bite.hookWindowS).toBeGreaterThan(1.5);
        landFish(s, ctx, bite, 'shallows');
      }
      expect(coachStep(s, v())).toBe('guide');
      s.flags.tutGuide = true;
      expect(coachStep(s, v())).toBeNull();
    }
  });

  it('points back to the map if the player wanders off before the first fish', () => {
    const s = newGame(2, ctx.now);
    s.flags.introSeen = true;
    pickup(s, ctx, 'start-rod');
    for (let i = 0; i < 3; i++) gather(s, ctx, 'swash');
    travel(s, ctx, 'grove');
    expect(coachStep(s, v())).toBe('map');
  });

  it('skip and old saves get out of the way', () => {
    const s = newGame(3, ctx.now);
    s.flags.tutDone = true;
    expect(coachStep(s, v())).toBeNull();
    const old = newGame(4, ctx.now);
    old.flags.hasRod = true;
    old.stats.casts = 30;
    old.stats.catches = 20;
    old.flags.tutGuide = true;
    expect(coachStep(old, v())).toBeNull();
  });
});
