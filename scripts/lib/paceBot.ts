/**
 * The pacing bot: a sensible but unhurried castaway who plays the island
 * through the real rules, charged human time for everything it does, and
 * notes when each lesson and milestone arrives. Used by `npm run pace` and
 * the playthrough test. It plays without a guide: it fishes, makes whatever
 * it has learned, and fetches what that needs.
 */
import type { Content } from '../../src/content/assemble';
import { castRange, rigPower, spoolOf } from '../../src/sim/catch';
import { simulateFight } from '../../src/sim/fight';
import { chance, makeRng } from '../../src/sim/rng';
import { craftCheck, recipeView } from '../../src/sim/world';
import {
  type Ctx, RAFT_PARTS, beginCast, cleanFish, craft, creelLimit, equip, gather, has, isDark, keepFish, landFish, landJunk, launchRaft,
  loseFish, nodeStatus, pickup, rackAdd, rackCollect, rackReady, raftStatus, releaseFish, rigOf, rollBite, speciesCaught, stolenBait,
  sunAt, travel,
} from '../../src/state/actions';
import { checkLessons } from '../../src/state/lessons';
import { checkThoughts } from '../../src/state/thoughts';
import { worthMaking } from '../../src/state/goals';
import { sourceOf } from '../../src/state/sources';
import { type GameState, newGame } from '../../src/state/state';

/** Seconds a person spends on each kind of action. */
export const HUMAN = {
  castOverhead: 8, // aim, cast, watch it land, wind in
  reveal: 4, // read the reveal card, keep or release
  gather: 2.5,
  travel: 6,
  craft: 5,
  clean: 3,
  readCard: 20, // a lesson or a journal page
  readThought: 7,
  browse: 0.06, // fraction of extra time spent looking around menus
  missNoFloat: 0.12, // strikes missed without a float
  missFloat: 0.05,
};

export interface PaceResult {
  minutes: number;
  launched: boolean;
  events: { minute: number; what: string }[];
  /** Every thought card, story or mind, with when it came up. */
  thoughts: { minute: number; cast: number; id: string }[];
  milestones: Record<string, number>;
  state: GameState;
}


export function runPace(content: Content, seed: number, startIso = '2027-02-01T14:00:00Z', maxMinutes = 420, session = { minutes: 40, breakHours: 9 }): PaceResult {
  const t0 = Date.parse(startIso);
  let now = t0;
  /** Minutes actually spent playing; time away between sessions does not count. */
  let played = 0;
  let sessionLeft = session.minutes;
  const s = newGame(seed, now);
  s.flags.introSeen = true;
  const rng = makeRng(seed ^ 0x5bd1e995);
  const events: PaceResult['events'] = [];
  const thoughts: PaceResult['thoughts'] = [];
  const milestones: Record<string, number> = {};
  const minute = () => played;
  const ctx = (): Ctx => ({ content, now, deviceTz: 'America/Belize' });
  const spend = (sec: number) => {
    const ms = sec * 1000 * (1 + HUMAN.browse);
    now += ms;
    played += ms / 60_000;
    sessionLeft -= ms / 60_000;
    if (sessionLeft <= 0) {
      // Put the phone down; the island keeps its own time.
      now += session.breakHours * 3_600_000;
      sessionLeft = session.minutes;
    }
  };
  const note = (what: string) => {
    if (milestones[what] != null) return;
    events.push({ minute: Math.round(minute() * 10) / 10, what });
    milestones[what] ??= minute();
  };
  /** Run a reducer, then let the game teach whatever it has become ready to teach. */
  const act = <A extends unknown[], R>(fn: (s: GameState, c: Ctx, ...a: A) => R, ...args: A): R => {
    const before = { pages: s.pagesFound, held: { ...s.everHeld }, lessons: s.lessons.length };
    const out = fn(s, ctx(), ...args);
    const taught = checkLessons(s, ctx());
    // Lessons that came on a page were taught inside the action itself.
    for (const l of s.lessons.slice(before.lessons)) note(`lesson: ${l}`);
    for (const e of taught) {
      if (e.type === 'lesson') {
        note(`lesson: ${e.lessonId}`);
        spend(HUMAN.readCard);
      }
    }
    for (const e of checkThoughts(s, ctx(), s.lessons.length > before.lessons)) {
      if (e.type !== 'thought') continue;
      thoughts.push({ minute: Math.round(minute() * 10) / 10, cast: s.stats.casts, id: e.thoughtId ?? `mind: ${e.lines[0]}` });
      spend(HUMAN.readThought);
    }
    if (s.pagesFound > before.pages) {
      note(`page ${s.pagesFound}`);
      spend(HUMAN.readCard);
    }
    for (const id of ['stone-knife', 'bamboo-rod', 'braided-line', 'feather-lure', 'campfire', 'torch', 'drying-rack', 'woven-trap']) {
      if (s.everHeld[id] && !before.held[id]) note(`made: ${id}`);
    }
    return out;
  };
  const go = (loc: string) => {
    if (s.locationId === loc) return;
    act(travel, loc);
    spend(HUMAN.travel);
  };
  const tapGather = (loc: string, hs: string): boolean => {
    go(loc);
    const l = content.locations[loc];
    const h = l.scene.hotspots.find((x) => x.id === hs);
    if (!h) return false;
    const st = nodeStatus(s, ctx(), l, h);
    if (st.needsTool || !st.open || st.save.stock <= 0) return false;
    const before = JSON.stringify(s.inventory);
    act(gather, hs);
    spend(HUMAN.gather);
    return JSON.stringify(s.inventory) !== before;
  };

  // ---- the opening, as the walkthrough plays it ----
  act(pickup, 'start-rod');
  for (let i = 0; i < 3; i++) tapGather('beach', 'swash');
  s.flags.tutGuide = true;
  s.flags.tutBench = true;

  const hooks = () => Object.keys(s.inventory).filter((id) => has(s, id) && content.items[id]?.kind === 'hook');

  function setRig(zone: string) {
    const best = (kind: string, score: (id: string) => number) => Object.keys(s.inventory).filter((id) => has(s, id) && content.items[id]?.kind === kind).sort((a, b) => score(b) - score(a))[0];
    const rod = best('rod', (id) => content.items[id].rod!.tier);
    const line = best('line', (id) => content.items[id].line!.strength);
    if (rod) act(equip, 'rod', rod);
    if (line) act(equip, 'line', line);
    const deep = zone !== 'shallows' && zone !== 'flats';
    const hook = has(s, 'bone-hook') && (deep || chance(rng, 0.5)) ? 'bone-hook' : hooks().find((h) => h !== 'bone-hook') ?? hooks()[0];
    if (hook) act(equip, 'hook', hook);
    const bait = has(s, 'cut-bait') && s.rig.hook === 'bone-hook' ? 'cut-bait' : has(s, 'small-crab') && zone === 'flats' ? 'small-crab' : has(s, 'sand-flea') ? 'sand-flea' : has(s, 'cut-bait') ? 'cut-bait' : has(s, 'coconut-meat') ? 'coconut-meat' : null;
    if (bait) act(equip, 'bait', bait);
    if (has(s, 'coconut-float')) act(equip, 'float', 'coconut-float');
    if (has(s, 'stone-sinker') && deep) act(equip, 'sinker', 'stone-sinker');
    else act(equip, 'sinker', null);
    s.rig.method = 'bait';
  }

  function baitCount() {
    return ['sand-flea', 'cut-bait', 'small-crab', 'coconut-meat'].reduce((n, id) => n + (s.inventory[id] ?? 0), 0);
  }

  function cleanSome(n: number) {
    if (!has(s, 'stone-knife')) return;
    go('camp');
    for (let i = 0; i < n; i++) {
      const f = s.creel.find((x) => content.species[x.speciesId].kind === 'fish');
      if (!f) return;
      act(cleanFish, f.uid);
      spend(HUMAN.clean);
    }
  }

  function topUpBait() {
    if (baitCount() >= 3) return;
    if (has(s, 'stone-knife') && s.creel.some((f) => content.species[f.speciesId].kind === 'fish')) return cleanSome(2);
    for (let i = 0; i < 4; i++) tapGather('beach', 'swash');
  }

  function fishOnce(loc: string, zone: string) {
    if (!hooks().length) return;
    topUpBait();
    go(loc);
    setRig(zone);
    const rig = rigOf(s, content);
    if (!rig?.bait || !rig.hook) return;
    // People cast as far as they can now and then, especially when the water they want is just out of reach.
    const zdef = content.locations[loc].zones.find((z) => z.id === zone)!;
    const power = castRange(rig) < zdef.minCastRange || chance(rng, 0.15) ? 1 : 0.6;
    const plan = act(beginCast, zone, power);
    if (!plan) return;
    spend(plan.waitS + HUMAN.castOverhead);
    const bite = act(rollBite, zone);
    if (bite.kind === 'junk') {
      act(landJunk, bite.itemId);
      spend(HUMAN.reveal);
    } else if (bite.kind === 'stolen') act(stolenBait);
    else if (bite.kind === 'fish') {
      const missP = rig.float ? HUMAN.missFloat : HUMAN.missNoFloat;
      if (chance(rng, missP)) {
        act(loseFish, bite, zone, 'missed');
        return;
      }
      let landed = true;
      if (bite.outcome === 'overmatched') landed = false;
      else if (bite.outcome === 'fight') {
        const sp = content.species[bite.speciesId];
        const res = simulateFight({ species: sp, ratio: bite.ratio, startDist: 0.5, greenBonus: rig.reel?.reel?.greenBonus ?? 0, capacity: spoolOf(rig) }, rng, content.balance);
        spend(res.seconds);
        landed = res.outcome === 'landed';
      } else spend(1.3);
      if (!landed) {
        act(loseFish, bite, zone, bite.outcome === 'overmatched' ? 'snapped' : 'pulled');
        return;
      }
      const r = act(landFish, bite, zone);
      spend(HUMAN.reveal);
      if (r.releaseOnly) act(releaseFish, r);
      else if (s.creel.length >= creelLimit(s, content)) {
        act(keepFish, r); // full: the game notices
        act(releaseFish, r);
      } else act(keepFish, r);
    }
  }

  /** Make the next thing it knows how to make, fetching what that needs. Returns true if it did something. */
  function workOnCrafts(): boolean {
    const wanted = s.recipesKnown
      .map((id) => content.recipes[id])
      .filter((r) => r && recipeView(r, s.recipesKnown) === 'known')
      .filter((r) => (r.tier >= 3 ? !has(s, r.output.item) && !s.flags.launched : worthMaking(s, content, r.output.item)))
      .filter((r) => r.id !== 'provisions' || s.larder.length >= 5);
    // Keep a spare hook once shell hooks are known.
    const hookCount = hooks().reduce((n, id) => n + s.inventory[id], 0);
    if (s.recipesKnown.includes('shell-hook') && hookCount < 2) wanted.unshift(content.recipes['shell-hook']);
    for (const r of wanted) {
      const missingTool = [...r.tools, ...(r.station ? [r.station] : [])].find((t) => !has(s, t));
      if (missingTool) continue;
      const check = r.special === 'provisions' ? { ok: true, missing: [] } : craftCheck(r, s.inventory);
      if (check.ok) {
        go('camp');
        act(craft, r.id);
        spend(HUMAN.craft);
        return true;
      }
      for (const m of check.missing) {
        const sub = Object.values(content.recipes).find((x) => x.output.item === m.item && s.recipesKnown.includes(x.id));
        if (sub) {
          const subCheck = craftCheck(sub, s.inventory);
          if (subCheck.ok) {
            go('camp');
            act(craft, sub.id);
            spend(HUMAN.craft);
            return true;
          }
          for (const sm of subCheck.missing) {
            const src = sourceOf(content, sm.item, s);
            if (src && tapGather(src.locationId, src.hotspotId)) return true;
          }
          continue;
        }
        if (m.item === 'fish-bone' || m.item === 'cut-bait') {
          if (s.creel.some((f) => content.species[f.speciesId].kind === 'fish') && has(s, 'stone-knife')) {
            cleanSome(1);
            return true;
          }
          continue;
        }
        const src = sourceOf(content, m.item, s);
        if (src && tapGather(src.locationId, src.hotspotId)) return true;
      }
    }
    return false;
  }

  function smokeFish() {
    if (!has(s, 'drying-rack') || s.larder.length >= 6) return;
    const c = ctx();
    if (s.rack.some((r) => rackReady(r, c))) {
      go('camp');
      act(rackCollect);
    }
    const kinds = new Set([...s.larder, ...s.rack.map((r) => r.fish)].map((f) => f.speciesId));
    for (const f of [...s.creel]) {
      if (s.rack.length >= content.balance.camp.rackSlots) break;
      if (content.species[f.speciesId].kind !== 'fish') continue;
      if (kinds.size < 3 && kinds.has(f.speciesId) && s.creel.some((x) => !kinds.has(x.speciesId) && content.species[x.speciesId].kind === 'fish')) continue;
      go('camp');
      act(rackAdd, f.uid);
      kinds.add(f.speciesId);
    }
  }

  let lastWrackDay = '';
  let loops = 0;
  while (minute() < maxMinutes && !s.flags.launched && loops++ < 40000) {
    const c = ctx();
    const sun = sunAt(c, 'beach');
    if (raftStatus(s).ready) {
      go('camp');
      act(launchRaft);
      note('launched');
      break;
    }
    // Check the wrack line once a day for what the tide brought.
    if (s.lessons.includes('hooks') && sun.local.dayKey !== lastWrackDay) {
      lastWrackDay = sun.local.dayKey;
      for (let i = 0; i < 4; i++) tapGather('beach', 'wrack');
    }
    smokeFish();
    if (workOnCrafts()) continue;
    // Where to fish.
    const rig = rigOf(s, content);
    const reach = rig ? castRange(rig) : 0;
    const dark = isDark(s, c);
    let loc = 'rocky-point';
    let zone = 'shallows';
    if (!dark && reach >= 0.45 && (rigPower(rig!) >= 2 || chance(rng, 0.3))) zone = 'reef-edge';
    if (!dark && s.lessons.includes('sight') && chance(rng, speciesCaught(s, content) < 9 ? 0.3 : 0.1)) {
      loc = 'lagoon';
      zone = 'flats';
    }
    fishOnce(loc, zone);
    // Note the bearing when it arrives.
    if (s.flags.bearing) note('bearing');
  }
  if (s.flags.launched) note('launched');
  return { minutes: minute(), launched: !!s.flags.launched, events, thoughts, milestones, state: s };
}

export { RAFT_PARTS };
