/**
 * The fishing interaction: one continuous touch. Drag to cast, wait or reel,
 * tap to hook, hold and release to fight. Reads state and sends actions; every
 * rule about what bites and who wins lives in sim/.
 */
import type { Location, Zone } from '../content/schema';
import type { GameAudio } from '../platform/audio';
import { vibrate } from '../platform/audio';
import { type Cruiser, type FishBite, castRange, drawCruiser, spoolOf, strikeRate } from '../sim/catch';
import { type FightState, startFight, stepFight } from '../sim/fight';
import { type Rng, clamp, lerp, makeRng, range } from '../sim/rng';
import {
  type Reveal, beginCast, catchCtx, isDark, landFish, landJunk, loseFish, reactToBait, refusal, rigOf, rigProblem, rollBite, sighting,
  stolenBait, sunAt,
} from '../state/actions';
import type { Store } from '../state/store';
import type { Light } from './light';
import { TOP_DOWN, drawShape } from './silhouettes';

type G = CanvasRenderingContext2D;

export type FishPhase = 'idle' | 'aiming' | 'flying' | 'waiting' | 'bite' | 'fight' | 'retrieve' | 'landing' | 'reelin' | 'reveal';

export interface FishingHost {
  store: Store;
  audio: GameAudio;
  onPhase(phase: FishPhase): void;
  showReveal(reveal: Reveal): void;
  toast(text: string, glyph?: string, tone?: 'good' | 'warn' | 'info'): void;
}

interface Swimmer extends Cruiser {
  x: number;
  y: number;
  /** Heading in radians, screen space. */
  dir: number;
  speed: number;
  state: 'cruise' | 'approach' | 'flee';
  t: number;
  noticed: boolean;
  sightingOnly: boolean;
  shape: string;
  zoneId: string;
  wander: number;
}

interface Ripple {
  x: number;
  y: number;
  age: number;
  life: number;
  size: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

const K = 1.6; // perspective strength
const Y_NEAR = 0.895;
const HANDS = { x: 0.5, y: 0.93 };

export class Fishing {
  phase: FishPhase = 'idle';
  private t = 0;
  private W = 1;
  private H = 1;
  private yFar: number;
  private zones: Zone[];
  private holding = false;
  private pointerStart: { x: number; y: number; moved: boolean } | null = null;
  private aim = { power: 0, angle: 0 };
  private cast = { x: 0.5, y: 0.6, d: 0.3, angle: 0, zoneId: '' };
  private floatPos = { x: 0.5, y: 0.6 };
  private flyT = 0;
  private flyDur = 0.7;
  private wait = { left: 0, nibbles: 0, nibbleIn: 0, active: true, quietCasts: 0, nibbling: false };
  private bob = 0;
  private under = 0;
  private bite: FishBite | null = null;
  private windowLeft = 0;
  private fight: FightState | null = null;
  private fightRng: Rng = makeRng(1);
  private lure = { d: 0, speed: 0, rate: 0, followed: false };
  private pendingJunk: string | null = null;
  private landT = 0;
  private landFrom = { x: 0.5, y: 0.6 };
  private swimmers: Swimmer[] = [];
  private spawnIn = 2;
  private ambientIn = 25;
  private ripples: Ripple[] = [];
  private drops: Drop[] = [];
  private fx: Rng = makeRng((Math.random() * 2 ** 32) >>> 0);
  private hooked: Swimmer | null = null;
  private jumpT = 0;
  private flash = 0;
  private hint = '';
  private hintT = 0;
  private rodWhip = 0;

  constructor(private loc: Location, horizon: number, private host: FishingHost) {
    this.yFar = horizon + 0.018;
    this.zones = loc.zones.filter((z) => z.cast).sort((a, b) => a.minCastRange - b.minCastRange);
  }

  // ---------- geometry ----------

  /** The horizon moves when the screen changes shape or the scene art loads. */
  setHorizon(horizon: number): void {
    this.yFar = horizon + 0.018;
  }

  /** Screen y (0..1) for a cast distance (0..1). Far water is compressed toward the horizon. */
  private yOf(d: number): number {
    const f = (1 - 1 / (1 + K * d)) / (1 - 1 / (1 + K));
    return Y_NEAR - (Y_NEAR - this.yFar) * f;
  }

  private dOf(y: number): number {
    const f = clamp((Y_NEAR - y) / (Y_NEAR - this.yFar), 0, 0.999);
    const inner = 1 - f * (1 - 1 / (1 + K));
    return clamp((1 / inner - 1) / K, 0, 1);
  }

  private scaleAt(y: number): number {
    return lerp(0.42, 1, clamp((y - this.yFar) / (Y_NEAR - this.yFar), 0, 1));
  }

  private zoneAt(d: number): Zone {
    let z = this.zones[0];
    for (const c of this.zones) if (d >= c.minCastRange) z = c;
    return z;
  }

  private rodTip(): { x: number; y: number } {
    let x = 0.6;
    let y = 0.735;
    if (this.phase === 'aiming') {
      x += 0.1 * this.aim.power + 0.05 * Math.sin(this.aim.angle);
      y += 0.07 * this.aim.power;
    }
    x -= 0.09 * this.rodWhip;
    y -= 0.03 * this.rodWhip;
    if (this.phase === 'fight' && this.fight) {
      const f = this.fishPos();
      const pull = clamp(this.fight.tension, 0, 1.2);
      x += (f.x - x) * 0.16 * pull;
      y += (f.y - y) * 0.12 * pull + 0.02 * pull;
    }
    if (this.phase === 'bite') y += 0.012;
    return { x, y };
  }

  private fishPos(): { x: number; y: number } {
    const f = this.fight;
    if (!f) return this.floatPos;
    const d = clamp(f.dist * 1.05, 0.015, 0.98);
    return { x: clamp(0.5 + f.side * 0.34 * (0.35 + 0.65 * f.dist), 0.06, 0.94), y: this.yOf(d) };
  }

  // ---------- input ----------

  private rig() {
    return rigOf(this.host.store.state, this.host.store.content);
  }

  private dark(): boolean {
    return isDark(this.host.store.state, this.host.store.ctx());
  }

  pointerDown(px: number, py: number): void {
    this.holding = true;
    this.pointerStart = { x: px, y: py, moved: false };
    switch (this.phase) {
      case 'idle': {
        // A tap may be a look at a silhouette; a drag is a cast. Decide on move or release.
        break;
      }
      case 'waiting':
        if (this.wait.nibbling) {
          // Struck at a nibble: the fish lets go, but usually comes back.
          this.host.toast('Too soon. Wait for the float to go under.', '⏳', 'warn');
          this.wait.nibbling = false;
          this.wait.left = range(this.fx, 2.5, 6);
          this.host.audio.play('warn');
        } else this.reelIn();
        break;
      case 'bite':
        this.strike();
        break;
      case 'retrieve':
      case 'fight':
        break;
    }
  }

  pointerMove(px: number, py: number): void {
    const s = this.pointerStart;
    if (!s) return;
    const dx = s.x - px;
    const dy = s.y - py;
    const len = Math.hypot(dx, dy);
    if (len > 14) s.moved = true;
    if (this.phase === 'idle' && s.moved) {
      const problem = rigProblem(this.host.store.state, this.host.store.content);
      if (problem) {
        this.host.toast(problem, '🎣', 'warn');
        this.pointerStart = null;
        this.holding = false;
        return;
      }
      this.setPhase('aiming');
    }
    if (this.phase === 'aiming') {
      // Slingshot: pull back and the cast goes the other way. Dragging forward also works.
      const up = dy < 0 ? { x: dx, y: dy } : { x: -dx, y: -dy };
      this.aim.power = clamp((len - 14) / (this.H * 0.24), 0, 1);
      this.aim.angle = clamp(Math.atan2(up.x, -up.y), -0.95, 0.95);
    }
  }

  pointerUp(px: number, py: number): void {
    const s = this.pointerStart;
    this.holding = false;
    this.pointerStart = null;
    if (this.phase === 'aiming') {
      if (this.aim.power < 0.07) this.setPhase('idle');
      else this.releaseCast();
      return;
    }
    if (this.phase === 'idle' && s && !s.moved) this.lookAt(px / this.W, py / this.H);
  }

  cancelPointer(): void {
    this.holding = false;
    this.pointerStart = null;
    if (this.phase === 'aiming') this.setPhase('idle');
  }

  /** Tap on the water while idle: note a silhouette. */
  private lookAt(x: number, y: number): void {
    let best: Swimmer | null = null;
    let bestD = 1e9;
    for (const sw of this.swimmers) {
      const len = this.lenOf(sw);
      const d = Math.hypot((sw.x - x) * this.W, (sw.y - y) * this.H) / this.W;
      if (d < Math.max(0.07, len * 0.7) && d < bestD) {
        best = sw;
        bestD = d;
      }
    }
    if (best) {
      this.ripples.push({ x: best.x, y: best.y, age: 0, life: 0.9, size: 0.09 });
      this.host.store.run(sighting, best.speciesId);
    }
  }

  // ---------- casting ----------

  private target(): { x: number; y: number; d: number; reach: number } {
    const rig = this.rig();
    let reach = rig ? castRange(rig) : 0.4;
    if (this.dark() && this.zones[1]) reach = Math.min(reach, this.zones[1].minCastRange - 0.02);
    const d = Math.max(0.05, this.aim.power * reach);
    const y = this.yOf(d);
    const x = clamp(HANDS.x + Math.tan(this.aim.angle) * (HANDS.y - y) * (this.H / this.W), 0.05, 0.95);
    return { x, y, d, reach };
  }

  private releaseCast(): void {
    const rig = this.rig();
    if (!rig) return this.setPhase('idle');
    const acc = rig.rod.rod?.accuracy ?? 0.5;
    // Better rods wobble less.
    this.aim.angle += (this.fx.next() - 0.5) * (1 - acc) * 0.3;
    this.aim.power = clamp(this.aim.power * (1 + (this.fx.next() - 0.5) * (1 - acc) * 0.24), 0.05, 1);
    const tg = this.target();
    this.cast = { x: tg.x, y: tg.y, d: tg.d, angle: this.aim.angle, zoneId: this.zoneAt(tg.d).id };
    this.flyT = 0;
    this.flyDur = 0.5 + 0.35 * tg.d;
    this.rodWhip = 1;
    this.bite = null;
    this.hooked = null;
    this.pendingJunk = null;
    this.under = 0;
    this.host.audio.play('cast');
    this.setPhase('flying');
  }

  private landed(): void {
    const { store, audio } = this.host;
    this.floatPos = { x: this.cast.x, y: this.cast.y };
    audio.play('plop');
    this.ripples.push({ x: this.cast.x, y: this.cast.y, age: 0, life: 1.2, size: 0.07 });
    this.splash(this.cast.x, this.cast.y, 6, 0.5);
    const plan = store.act(beginCast, this.cast.zoneId);
    if (!plan) return this.setPhase('idle');
    const rig = this.rig();
    if (rig?.method === 'lure') {
      const c = catchCtx(store.state, store.ctx(), this.cast.zoneId, 'lure');
      this.lure = { d: this.cast.d, speed: 0, rate: c ? strikeRate(c) : 0, followed: false };
      this.setPhase('retrieve');
      this.say('Hold to retrieve. Pulse to slow it down.', 4);
    } else {
      this.wait = { left: plan.waitS, nibbles: plan.nibbles, nibbleIn: 0, active: plan.active, quietCasts: this.wait.quietCasts, nibbling: false };
      this.setPhase('waiting');
    }
    this.spookOrAttract();
  }

  private reelIn(): void {
    if (this.phase === 'reelin') return;
    this.landFrom = { ...this.floatPos };
    this.landT = 0;
    this.host.audio.play('tap');
    this.setPhase('reelin');
  }

  // ---------- bites ----------

  private doBite(): void {
    const { store, audio } = this.host;
    const bite = store.act(rollBite, this.cast.zoneId);
    this.wait.nibbling = false;
    switch (bite.kind) {
      case 'none':
        this.wait.quietCasts++;
        if (this.wait.quietCasts === 2 || this.wait.quietCasts % 6 === 0) {
          this.host.toast('Not a touch. Wrong bait, wrong hour or wrong water.', '🌊');
        }
        this.wait.left = range(this.fx, 10, 18);
        this.wait.nibbles = 0;
        break;
      case 'nibble':
        this.host.toast('Something heavy mouthed the bait and moved on.', '👀');
        this.again();
        break;
      case 'stolen':
        store.run(stolenBait);
        if (this.rig()?.bait) this.again();
        else this.reelIn();
        break;
      case 'junk':
        this.pendingJunk = bite.itemId;
        this.under = 0.6;
        this.host.toast('Something heavy. Not pulling back.', '🪢');
        this.reelIn();
        break;
      case 'fish':
        this.bite = bite;
        this.windowLeft = bite.hookWindowS;
        this.under = 1;
        this.flash = 1;
        this.wait.quietCasts = 0;
        audio.play('bite');
        vibrate(40, store.state.settings.haptics);
        this.splash(this.floatPos.x, this.floatPos.y, 5, 0.4);
        this.ripples.push({ x: this.floatPos.x, y: this.floatPos.y, age: 0, life: 0.8, size: 0.09 });
        this.setPhase('bite');
        break;
    }
  }

  private again(): void {
    this.wait.left = range(this.fx, 4, 10);
    this.wait.nibbles = Math.floor(range(this.fx, 1, 3.99));
    this.under = 0;
    if (this.phase !== 'waiting') this.setPhase('waiting');
  }

  private strike(): void {
    const bite = this.bite;
    if (!bite) return;
    this.host.audio.play('hook');
    vibrate([20, 30, 20], this.host.store.state.settings.haptics);
    this.beginFightOrLand(bite, this.cast.d);
  }

  private beginFightOrLand(bite: FishBite, d: number): void {
    const { store } = this.host;
    if (bite.outcome === 'auto') {
      this.landFrom = { ...this.floatPos };
      this.landT = 0;
      this.setPhase('landing');
      return;
    }
    const species = store.content.species[bite.speciesId];
    const rig = this.rig();
    const reach = rig ? castRange(rig) : 0.5;
    this.fightRng = makeRng((store.state.rng ^ 0x9e3779b9) >>> 0);
    const leg = bite.legendaryId ? store.content.legendaries[bite.legendaryId] : null;
    this.fight = startFight({
      species, ratio: bite.ratio, startDist: clamp(d / Math.max(0.3, reach), 0, 1), greenBonus: rig?.reel?.reel?.greenBonus ?? 0,
      capacity: rig ? spoolOf(rig) : 1, staminaMult: leg?.fight?.staminaMult,
    }, this.fightRng);
    if (leg) this.host.toast(`This is no ordinary fish. ${leg.name}?`, '✨', 'good');
    // Start the fish where the float was.
    this.fight.dist = clamp(d / 1.05, 0.2, 0.9);
    this.fight.side = clamp((this.floatPos.x - 0.5) / (0.34 * (0.35 + 0.65 * this.fight.dist)), -1, 1);
    this.setPhase('fight');
    this.say(bite.outcome === 'overmatched' ? 'It is far too strong…' : 'Hold to reel. Let go when the line runs red.', 4);
  }

  private missed(): void {
    const { store } = this.host;
    if (!this.bite) return;
    store.run(loseFish, this.bite, this.cast.zoneId, 'missed');
    this.bite = null;
    this.under = 0;
    if (this.hooked) {
      this.hooked.state = 'flee';
      this.swimmers.push(this.hooked);
      this.hooked = null;
    }
    if (this.rig()?.bait) this.again();
    else this.reelIn();
  }

  private finishFight(): void {
    const { store, audio } = this.host;
    const f = this.fight;
    const bite = this.bite;
    if (!f || !bite) return;
    audio.reel(0);
    if (f.outcome === 'landed') {
      this.landFrom = this.fishPos();
      this.landT = 0.6;
      this.fight = null;
      this.setPhase('landing');
      return;
    }
    const reason = f.outcome === 'snapped' ? 'snapped' : f.outcome === 'spooled' ? 'spooled' : 'pulled';
    audio.play(reason === 'pulled' ? 'warn' : 'snap');
    vibrate(reason === 'pulled' ? 60 : [80, 40, 120], store.state.settings.haptics);
    const p = this.fishPos();
    this.splash(p.x, p.y, 14, 1);
    store.run(loseFish, bite, this.cast.zoneId, reason);
    this.fight = null;
    this.bite = null;
    this.hooked = null;
    this.setPhase('idle');
  }

  private finishLanding(): void {
    const { store, audio } = this.host;
    const bite = this.bite;
    this.bite = null;
    this.hooked = null;
    if (!bite) return this.setPhase('idle');
    const reveal = store.act(landFish, bite, this.cast.zoneId);
    audio.play(reveal.legendaryId || reveal.grade === 'trophy' || reveal.grade === 'record' ? 'trophy' : reveal.isNew ? 'new' : 'catch');
    vibrate(reveal.isNew ? [30, 40, 30, 40, 60] : 30, store.state.settings.haptics);
    this.setPhase('reveal');
    this.host.showReveal(reveal);
  }

  /** The UI has dealt with the reveal card. */
  afterReveal(): void {
    if (this.phase === 'reveal') this.setPhase('idle');
  }

  /** Leaving the scene or opening a menu mid-cast: quietly wind in. */
  reset(): void {
    this.host.audio.reel(0);
    this.fight = null;
    this.bite = null;
    this.hooked = null;
    this.pendingJunk = null;
    this.holding = false;
    this.pointerStart = null;
    if (this.phase !== 'reveal') this.setPhase('idle');
  }

  get busy(): boolean {
    return this.phase !== 'idle' && this.phase !== 'aiming';
  }

  private setPhase(p: FishPhase): void {
    if (this.phase === p) return;
    this.phase = p;
    this.host.onPhase(p);
  }

  private say(text: string, seconds: number): void {
    this.hint = text;
    this.hintT = seconds;
  }

  // ---------- sight casting ----------

  private lenOf(sw: Cruiser & { y: number }): number {
    return clamp(sw.lengthCm * 0.003 * this.scaleAt(sw.y), 0.045, 0.6);
  }

  private spawn(kinds: Array<'sight' | 'sighting'>, zone: Zone, rare = false): void {
    const { store } = this.host;
    const sun = sunAt(store.ctx(), this.loc.id);
    const c = drawCruiser({ content: store.content, locationId: this.loc.id, zoneId: zone.id, phase: sun.phase, month: sun.local.month }, this.fx, kinds);
    if (!c) return;
    const sp = store.content.species[c.speciesId];
    const idx = this.zones.indexOf(zone);
    const next = this.zones[idx + 1];
    const d0 = Math.max(zone.minCastRange, 0.06);
    const d1 = Math.min(next ? next.minCastRange : 0.97, 0.97);
    const d = range(this.fx, d0 + (d1 - d0) * 0.1, d1 - (d1 - d0) * 0.1);
    const fromLeft = this.fx.next() < 0.5;
    const top = TOP_DOWN.has(sp.silhouette);
    this.swimmers.push({
      ...c, x: fromLeft ? -0.12 : 1.12, y: this.yOf(d), dir: fromLeft ? range(this.fx, -0.2, 0.2) : Math.PI + range(this.fx, -0.2, 0.2),
      speed: (top ? 0.025 : range(this.fx, 0.035, 0.07)) * (rare ? 1.6 : 1), state: 'cruise', t: 0, noticed: false,
      sightingOnly: sp.kind === 'sighting', shape: sp.silhouette, zoneId: zone.id, wander: this.fx.next() * 10,
    });
  }

  /** The bait has just landed: spook fish it hit, turn fish that saw it. */
  private spookOrAttract(): void {
    const { x, y } = this.floatPos;
    let spooked = false;
    for (const sw of this.swimmers) {
      if (sw.sightingOnly || sw.state !== 'cruise') continue;
      const L = this.lenOf(sw);
      const dist = Math.hypot((x - sw.x) * this.W, (y - sw.y) * this.H) / (L * this.W);
      if (dist < 1) {
        sw.state = 'flee';
        sw.dir += Math.PI * (0.7 + 0.6 * this.fx.next());
        spooked = true;
      }
    }
    if (spooked) {
      this.host.toast('Right on its head. It bolted.', '💨', 'warn');
      for (const sw of this.swimmers) {
        const near = Math.hypot((x - sw.x) * this.W, (y - sw.y) * this.H) / this.W < 0.3;
        if (near && !sw.sightingOnly && sw.state === 'cruise') {
          sw.state = 'flee';
          sw.dir += Math.PI * 0.8;
        }
      }
      return;
    }
    this.noticeCheck(3.6, 1);
  }

  /** Does any cruising fish have the bait ahead of it and close enough to see? */
  private noticeCheck(maxLengths: number, chance: number): void {
    if (this.hooked || this.swimmers.some((s) => s.state === 'approach')) return;
    const { x, y } = this.phase === 'retrieve' ? this.lurePos() : this.floatPos;
    for (const sw of this.swimmers) {
      if (sw.sightingOnly || sw.state !== 'cruise' || sw.noticed) continue;
      const L = this.lenOf(sw) * this.W;
      const vx = (x - sw.x) * this.W;
      const vy = (y - sw.y) * this.H;
      const dist = Math.hypot(vx, vy);
      if (dist > maxLengths * L || dist < 0.6 * L) continue;
      const ahead = (Math.cos(sw.dir) * vx + Math.sin(sw.dir) * vy) / dist;
      if (ahead < 0.25) continue;
      sw.noticed = true;
      if (this.fx.next() > chance) continue;
      sw.state = 'approach';
      sw.t = 0;
      return;
    }
  }

  private arrive(sw: Swimmer): void {
    const { store } = this.host;
    const zoneId = this.phase === 'retrieve' ? this.zoneAt(this.lure.d).id : this.cast.zoneId;
    const r = store.act(reactToBait, zoneId, sw);
    if (r.kind === 'refuse') {
      sw.state = 'flee';
      sw.speed *= 0.6;
      sw.dir += Math.PI * (0.55 + 0.3 * this.fx.next());
      store.run(refusal, sw.speciesId, r.reason);
      return;
    }
    this.swimmers = this.swimmers.filter((s) => s !== sw);
    this.hooked = sw;
    this.bite = r.bite;
    this.cast.zoneId = zoneId;
    if (this.phase === 'retrieve') {
      // A lure is moving: the fish hooks itself on the strike.
      this.floatPos = this.lurePos();
      this.host.audio.play('bite');
      this.splash(this.floatPos.x, this.floatPos.y, 10, 0.8);
      this.strike();
      return;
    }
    this.windowLeft = r.bite.hookWindowS;
    this.under = 1;
    this.flash = 1;
    this.host.audio.play('bite');
    vibrate(40, store.state.settings.haptics);
    this.splash(this.floatPos.x, this.floatPos.y, 5, 0.4);
    this.setPhase('bite');
  }

  private lurePos(): { x: number; y: number } {
    const y = this.yOf(this.lure.d);
    return { x: clamp(HANDS.x + Math.tan(this.cast.angle) * (HANDS.y - y) * (this.H / this.W), 0.05, 0.95), y };
  }

  private updateSwimmers(dt: number): void {
    const dark = this.dark();
    if (dark) {
      this.swimmers = [];
      return;
    }
    // residents of the sight zones
    const sightZones = this.zones.filter((z) => this.loc.sightZones.includes(z.id));
    if (sightZones.length) {
      this.spawnIn -= dt;
      const fish = this.swimmers.length;
      if (this.spawnIn <= 0 && fish < 4) {
        // Most cruisers are on the near flat, where they can be cast to.
        const zone = this.fx.next() < 0.7 ? sightZones[0] : sightZones[sightZones.length - 1];
        this.spawn(['sight', 'sighting'], zone);
        this.spawnIn = range(this.fx, 3, 8);
      }
    }
    // the occasional passer-by anywhere: a dolphin off the drop-off, a turtle in the channel
    this.ambientIn -= dt;
    if (this.ambientIn <= 0) {
      const zone = this.zones[Math.floor(this.fx.next() * this.zones.length)];
      if (zone && !this.loc.sightZones.includes(zone.id)) this.spawn(['sighting'], zone, true);
      this.ambientIn = range(this.fx, 35, 80);
    }
    const bait = this.phase === 'retrieve' ? this.lurePos() : this.floatPos;
    for (const sw of this.swimmers) {
      sw.t += dt;
      const sc = this.scaleAt(sw.y);
      if (sw.state === 'cruise') {
        sw.dir += Math.sin(sw.t * 0.7 + sw.wander) * 0.25 * dt;
        // keep to the zone's band of water
        const bandTop = this.yOf(0.97);
        if (sw.y < bandTop + 0.02) sw.dir += 0.6 * dt * Math.sign(Math.cos(sw.dir));
        if (sw.y > Y_NEAR - 0.04) sw.dir -= 0.6 * dt * Math.sign(Math.cos(sw.dir));
      } else if (sw.state === 'approach') {
        const vx = (bait.x - sw.x) * this.W;
        const vy = (bait.y - sw.y) * this.H;
        const want = Math.atan2(vy, vx);
        let diff = want - sw.dir;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        sw.dir += clamp(diff, -3 * dt, 3 * dt);
        const dist = Math.hypot(vx, vy) / this.W;
        if (dist < Math.max(0.025, this.lenOf(sw) * 0.5)) {
          if (this.phase === 'waiting' || this.phase === 'retrieve') this.arrive(sw);
          else sw.state = 'cruise';
          continue;
        }
        if (this.phase !== 'waiting' && this.phase !== 'retrieve') sw.state = 'cruise';
      }
      const v = sw.speed * sc * (sw.state === 'flee' ? 4 : sw.state === 'approach' ? 1.8 : 1);
      sw.x += Math.cos(sw.dir) * v * dt;
      sw.y += Math.sin(sw.dir) * v * dt * (this.W / this.H) * 0.6;
    }
    this.swimmers = this.swimmers.filter((s) => s.x > -0.25 && s.x < 1.25 && s.y > this.yFar - 0.02 && s.y < 1.05 && s.t < 90);
  }

  // ---------- update ----------

  update(dt: number, W: number, H: number): void {
    this.W = W;
    this.H = H;
    this.t += dt;
    const { store, audio } = this.host;
    const b = store.content.balance;
    this.rodWhip = Math.max(0, this.rodWhip - dt * 3);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.hintT = Math.max(0, this.hintT - dt);
    this.bob += dt;
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < r.life);
    for (const d of this.drops) {
      d.age += dt;
      d.vy += 1.6 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    this.drops = this.drops.filter((d) => d.age < 0.7);
    this.updateSwimmers(dt);

    switch (this.phase) {
      case 'flying':
        this.flyT += dt;
        if (this.flyT >= this.flyDur) this.landed();
        break;
      case 'waiting': {
        const w = this.wait;
        if (this.swimmers.length) this.noticeCheck(2.6, 0.75);
        if (this.swimmers.some((s) => s.state === 'approach')) break; // a fish is coming; hold the blind bite
        if (!w.nibbling) {
          w.left -= dt;
          if (w.left <= 0) {
            if (w.nibbles > 0 && w.active) {
              w.nibbling = true;
              w.nibbleIn = 0.1;
            } else this.doBite();
          }
        } else {
          w.nibbleIn -= dt;
          if (w.nibbleIn <= 0) {
            if (w.nibbles > 0) {
              w.nibbles--;
              w.nibbleIn = range(this.fx, 0.45, 1.05);
              this.under = 0.35;
              audio.play('nibble');
              vibrate(8, store.state.settings.haptics);
              this.ripples.push({ x: this.floatPos.x, y: this.floatPos.y, age: 0, life: 0.6, size: 0.035 });
            } else this.doBite();
          }
        }
        this.under = Math.max(0, this.under - dt * 1.6);
        break;
      }
      case 'bite':
        this.windowLeft -= dt;
        if (this.windowLeft <= 0) this.missed();
        break;
      case 'retrieve': {
        const l = this.lure;
        const lure = this.rig()?.lure?.lure;
        l.speed += ((this.holding ? 1 : 0) - l.speed) * clamp(dt * 2.4, 0, 1);
        l.d -= l.speed * 0.115 * dt;
        audio.reel(this.holding ? 0.4 + 0.6 * l.speed : 0, 0);
        const pos = this.lurePos();
        this.floatPos = pos;
        if (l.speed > 0.15 && this.fx.next() < dt * 4) this.ripples.push({ x: pos.x, y: pos.y, age: 0, life: 0.5, size: 0.025 });
        const inBand = !!lure && l.speed >= lure.speedBand[0] && l.speed <= lure.speedBand[1];
        if (inBand) {
          if (this.swimmers.length) this.noticeCheck(3, 0.9);
          if (!this.swimmers.some((s) => s.state === 'approach') && this.fx.next() < l.rate * dt) {
            const bite = store.act(rollBite, this.zoneAt(l.d).id);
            if (bite.kind === 'fish') {
              this.bite = bite;
              this.cast.zoneId = this.zoneAt(l.d).id;
              audio.play('bite');
              this.splash(pos.x, pos.y, 10, 0.8);
              audio.reel(0);
              this.strike();
              break;
            } else if (bite.kind === 'junk') {
              this.pendingJunk = bite.itemId;
              audio.reel(0);
              this.reelIn();
              break;
            }
          }
        } else if (!l.followed && l.rate > 0 && l.speed > 0.2 && l.d < this.cast.d * 0.6 && this.fx.next() < dt * 0.25) {
          l.followed = true;
          this.host.toast(l.speed > (lure?.speedBand[1] ?? 1) ? 'A shape followed, then fell behind. Too fast?' : 'A shape followed, then lost interest. Too slow?', '👀');
        }
        if (l.d <= 0.035) {
          audio.reel(0);
          this.setPhase('idle');
        }
        break;
      }
      case 'fight': {
        const f = this.fight;
        if (!f) break;
        const wasJumping = f.jumping;
        const steps = Math.max(1, Math.round(dt / (1 / 120)));
        for (let i = 0; i < steps && f.outcome === 'fighting'; i++) stepFight(f, this.holding, dt / steps, this.fightRng, b);
        audio.reel(this.holding ? 0.5 : 0, clamp(f.tension, 0, 1));
        const p = this.fishPos();
        this.floatPos = p;
        if (f.jumping && !wasJumping) {
          this.jumpT = 0.001;
          audio.play('jump');
          this.splash(p.x, p.y, 16, 1.2);
          vibrate(30, store.state.settings.haptics);
        }
        if (this.jumpT > 0) {
          this.jumpT += dt;
          if (this.jumpT > 0.75) {
            this.jumpT = 0;
            this.splash(p.x, p.y, 12, 1);
          }
        }
        if (f.surge > 1 && this.fx.next() < dt * 10) this.splash(p.x, p.y, 2, 0.6);
        if (this.fx.next() < dt * 3) this.ripples.push({ x: p.x, y: p.y, age: 0, life: 0.7, size: 0.04 });
        if (f.tension > b.fight.redAt && this.fx.next() < dt * 8) vibrate(12, store.state.settings.haptics);
        if (f.outcome !== 'fighting') this.finishFight();
        break;
      }
      case 'landing': {
        this.landT += dt;
        const k = clamp(this.landT / b.fight.autoLandS, 0, 1);
        this.floatPos = { x: lerp(this.landFrom.x, HANDS.x, k), y: lerp(this.landFrom.y, Y_NEAR + 0.02, k) };
        audio.reel(0.9, 0.2);
        if (this.fx.next() < dt * 12) this.splash(this.floatPos.x, this.floatPos.y, 2, 0.5);
        if (k >= 1) {
          audio.reel(0);
          this.finishLanding();
        }
        break;
      }
      case 'reelin': {
        this.landT += dt;
        const k = clamp(this.landT / 0.55, 0, 1);
        this.floatPos = { x: lerp(this.landFrom.x, HANDS.x, k), y: lerp(this.landFrom.y, Y_NEAR + 0.02, k) };
        if (k >= 1) {
          const junk = this.pendingJunk;
          this.pendingJunk = null;
          this.setPhase('idle');
          if (junk) store.run(landJunk, junk);
        }
        break;
      }
    }
  }

  private splash(x: number, y: number, n: number, power: number): void {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * this.fx.next();
      const v = (0.08 + 0.22 * this.fx.next()) * power;
      this.drops.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 1.2, age: 0 });
    }
  }

  // ---------- drawing ----------

  /** Things in and under the water: silhouettes, ripples. Drawn before foreground land. */
  drawWater(g: G, L: Light): void {
    const { W, H } = this;
    const content = this.host.store.content;
    const ink = L.night > 0.5 ? 'rgba(4,10,24,' : 'rgba(10,36,48,';
    const drawFish = (shape: string, x: number, y: number, lenN: number, dir: number, alpha: number, t: number, top: boolean) => {
      const len = lenN * W;
      g.save();
      g.translate(x * W, y * H);
      // shadow on the bottom, a little below the fish
      const facingRight = Math.cos(dir) > 0;
      if (top) g.rotate(dir + Math.PI);
      else {
        if (facingRight) g.scale(-1, 1);
        g.rotate(Math.sin(t * 5) * 0.05);
      }
      g.scale(len, len * (top ? 1 : 0.9));
      g.globalAlpha = alpha * 0.25;
      g.translate(0.03, 0.09);
      drawShape(g, shape, { fill: `${ink}1)`, flat: true });
      g.translate(-0.03, -0.09);
      g.globalAlpha = alpha;
      drawShape(g, shape, { fill: `${ink}1)`, flat: true });
      g.restore();
    };
    for (const sw of this.swimmers) {
      const fade = clamp(Math.min(sw.t * 1.5, 1), 0, 1) * (sw.state === 'flee' ? 0.5 : 1);
      const lenN = this.lenOf(sw);
      const sp = content.species[sw.speciesId];
      if (sp.silhouette === 'dolphin') {
        // dolphins show as backs and fins rolling at the surface
        const roll = Math.sin(sw.t * 2.2);
        if (roll > 0) {
          g.save();
          g.translate(sw.x * W, sw.y * H);
          if (Math.cos(sw.dir) > 0) g.scale(-1, 1);
          g.beginPath();
          g.rect(-lenN * W, -lenN * W, lenN * 2 * W, lenN * W);
          g.clip();
          g.translate(0, (0.1 - roll * 0.16) * lenN * W);
          g.rotate(-0.25 + roll * 0.2);
          g.scale(lenN * W, lenN * W);
          g.globalAlpha = fade * 0.9;
          drawShape(g, 'dolphin', { fill: L.shade('#4f5c66'), flat: true });
          g.restore();
          if (this.fx.next() < 0.1) this.ripples.push({ x: sw.x, y: sw.y, age: 0, life: 0.8, size: lenN * 0.4 });
        }
        continue;
      }
      drawFish(sw.shape, sw.x, sw.y, lenN, sw.dir, 0.5 * fade * (1 - 0.4 * L.night), sw.t + sw.wander, TOP_DOWN.has(sw.shape));
    }
    // the fish on the line, as a shape under the surface
    if (this.bite && (this.phase === 'fight' || this.phase === 'landing' || this.phase === 'bite') && this.jumpT === 0) {
      const sp = content.species[this.bite.speciesId];
      const p = this.phase === 'bite' ? { x: this.floatPos.x, y: this.floatPos.y + 0.012 } : this.floatPos;
      const lenN = clamp(this.bite.lengthCm * 0.003 * this.scaleAt(p.y), 0.045, 0.6);
      const dir = this.fight ? (this.fight.sideVel >= 0 ? 0 : Math.PI) : Math.PI / 2;
      drawFish(sp.silhouette, p.x, p.y + 0.008, lenN, dir, this.phase === 'bite' ? 0.3 : 0.46, this.t * 2, TOP_DOWN.has(sp.silhouette));
    }
    // ripples
    for (const r of this.ripples) {
      const k = r.age / r.life;
      g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - k) * (1 - 0.4 * L.night)})`;
      g.lineWidth = Math.max(1, H * 0.0022);
      g.beginPath();
      const sc = this.scaleAt(r.y);
      g.ellipse(r.x * W, r.y * H, r.size * W * (0.3 + k) * sc, r.size * W * (0.3 + k) * sc * 0.32, 0, 0, 7);
      g.stroke();
    }
  }

  /** Line, float, rod and gauges. Drawn over everything. */
  drawOver(g: G, L: Light): void {
    const { W, H } = this;
    const rig = this.rig();
    if (!rig) return;
    const b = this.host.store.content.balance;
    const tip = this.rodTip();
    const active = this.phase !== 'idle' && this.phase !== 'aiming' && this.phase !== 'reveal';

    if (this.phase === 'aiming') this.drawAim(g, L, tip);

    // where the line meets the water (or the float in the air)
    let end = { ...this.floatPos };
    if (this.phase === 'flying') {
      const k = clamp(this.flyT / this.flyDur, 0, 1);
      const e = 1 - (1 - k) * (1 - k);
      end = { x: lerp(tip.x, this.cast.x, e), y: lerp(tip.y, this.cast.y, e) - Math.sin(Math.PI * k) * (0.1 + 0.16 * this.cast.d) };
    }
    const bobY = this.phase === 'waiting' || this.phase === 'bite' ? Math.sin(this.bob * 2.3) * 0.0035 : 0;

    if (active) {
      const tension = this.fight ? clamp(this.fight.tension, 0, 1) : this.phase === 'landing' || this.phase === 'reelin' ? 0.6 : 0.1;
      const sag = (1 - tension) * 0.07;
      const hot = this.fight && this.fight.tension > b.fight.redAt;
      g.strokeStyle = hot ? `rgba(255,${80 + 60 * Math.sin(this.t * 30)},70,0.95)` : `rgba(250,250,245,${0.75 - 0.3 * L.night})`;
      g.lineWidth = Math.max(1, W * 0.0028);
      g.beginPath();
      g.moveTo(tip.x * W, tip.y * H);
      g.quadraticCurveTo(((tip.x + end.x) / 2) * W, ((tip.y + end.y) / 2 + sag) * H, end.x * W, (end.y + bobY) * H);
      g.stroke();
    }

    // float or lure
    if (active && this.phase !== 'fight' && this.phase !== 'landing') {
      const sc = this.phase === 'flying' ? 0.8 : this.scaleAt(end.y);
      const r = W * 0.022 * Math.max(sc, 0.62);
      const x = end.x * W;
      const y = (end.y + bobY) * H + this.under * r * 1.3;
      if (rig.method === 'lure') {
        g.fillStyle = '#f4f1e6';
        g.beginPath();
        g.ellipse(x, y, r * 1.3, r * 0.45, -0.3, 0, 7);
        g.fill();
        g.fillStyle = '#d24a3a';
        g.beginPath();
        g.arc(x - r, y - r * 0.15, r * 0.35, 0, 7);
        g.fill();
      } else {
        const coconut = rig.float?.id === 'coconut-float';
        g.save();
        g.beginPath();
        g.rect(x - r * 2, y - r * 4, r * 4, r * 4 + (this.phase === 'flying' ? r * 4 : r * 0.25));
        g.clip();
        g.fillStyle = coconut ? '#7a5230' : '#e6e2d6';
        g.beginPath();
        g.ellipse(x, y - r * 0.3, r * 0.8, r, 0, 0, 7);
        g.fill();
        g.fillStyle = coconut ? '#f0e6cc' : '#d8402f';
        g.beginPath();
        g.ellipse(x, y - r * 0.75, r * 0.72, r * 0.55, 0, Math.PI, 0);
        g.fill();
        g.strokeStyle = '#2a2a2a';
        g.lineWidth = Math.max(1, r * 0.16);
        g.beginPath();
        g.moveTo(x, y - r * 1.25);
        g.lineTo(x, y - r * 2.1);
        g.stroke();
        g.restore();
      }
      if (this.phase === 'bite') {
        // unmistakable: the float is gone and the water flashes
        const k = clamp(this.windowLeft / Math.max(0.1, this.bite?.hookWindowS ?? 1), 0, 1);
        g.strokeStyle = `rgba(255,255,255,${0.9})`;
        g.lineWidth = W * 0.008;
        g.beginPath();
        g.arc(x, y - r * 3.6, r * 2.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
        g.stroke();
        g.fillStyle = '#fff';
        g.font = `800 ${Math.round(r * 3)}px ui-rounded, system-ui, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('!', x, y - r * 3.5);
      }
    }

    // a leaping fish
    if (this.jumpT > 0 && this.bite) {
      const sp = this.host.store.content.species[this.bite.speciesId];
      const k = this.jumpT / 0.75;
      const p = this.floatPos;
      const lenN = clamp(this.bite.lengthCm * 0.003 * this.scaleAt(p.y), 0.06, 0.6);
      g.save();
      g.translate(p.x * W, (p.y - Math.sin(Math.PI * k) * lenN * 0.9 * (W / H)) * H);
      g.rotate(-1.1 + k * 2.2);
      g.scale(lenN * W, lenN * W);
      drawShape(g, sp.silhouette, { fill: L.shade(sp.tint?.body ?? '#aab'), accent: sp.tint?.accent ? L.shade(sp.tint.accent) : undefined });
      g.restore();
    }

    // spray
    g.fillStyle = `rgba(255,255,255,${0.85 - 0.3 * L.night})`;
    for (const d of this.drops) {
      g.globalAlpha = 1 - d.age / 0.7;
      g.beginPath();
      g.arc(d.x * W, d.y * H, W * 0.005, 0, 7);
      g.fill();
    }
    g.globalAlpha = 1;

    this.drawRod(g, L, tip, rig.rod.id);

    if (this.flash > 0) {
      g.fillStyle = `rgba(255,255,255,${this.flash * 0.18})`;
      g.fillRect(0, 0, W, H);
    }
    if (this.phase === 'fight' && this.fight) this.drawTension(g, this.fight);
    if (this.phase === 'retrieve') this.drawLureGauge(g);
    if (this.hintT > 0 && this.hint) this.drawHint(g, this.hint, Math.min(1, this.hintT));
  }

  private drawRod(g: G, L: Light, tip: { x: number; y: number }, rodId: string): void {
    const { W, H } = this;
    const butt = { x: 0.93, y: 1.04 };
    const bend = this.fight ? clamp(this.fight.tension, 0, 1.2) * 0.07 : this.phase === 'bite' ? 0.03 : 0;
    const cx = (butt.x + tip.x) / 2 + 0.05 + bend;
    const cy = (butt.y + tip.y) / 2 - 0.03 - bend * 0.6;
    const col = rodId.includes('bamboo') ? '#c2a85c' : rodId.includes('old') ? '#6e5540' : '#3d4a56';
    g.lineCap = 'round';
    g.strokeStyle = L.shade(col);
    g.lineWidth = W * 0.016;
    g.beginPath();
    g.moveTo(butt.x * W, butt.y * H);
    g.quadraticCurveTo((butt.x * 0.55 + cx * 0.45) * W, (butt.y * 0.55 + cy * 0.45) * H, cx * W, cy * H);
    g.stroke();
    g.lineWidth = W * 0.007;
    g.beginPath();
    g.moveTo(cx * W, cy * H);
    g.quadraticCurveTo((cx * 0.5 + tip.x * 0.5 + bend * 0.2) * W, (cy * 0.5 + tip.y * 0.5 - bend * 0.3) * H, tip.x * W, tip.y * H);
    g.stroke();
    if (L.torch) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      const r = W * (0.75 + 0.02 * Math.sin(this.t * 11));
      const grad = g.createRadialGradient(0.5 * W, 0.9 * H, 0, 0.5 * W, 0.9 * H, r);
      grad.addColorStop(0, `rgba(255,170,80,${0.34 * L.night})`);
      grad.addColorStop(0.5, `rgba(255,150,70,${0.12 * L.night})`);
      grad.addColorStop(1, 'rgba(255,150,70,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
  }

  private drawAim(g: G, L: Light, tip: { x: number; y: number }): void {
    const { W, H } = this;
    const tg = this.target();
    const rig = this.rig();
    const reach = rig ? castRange(rig) : 0;
    const small = Math.round(Math.max(11, W * 0.03));
    g.font = `600 ${small}px ui-rounded, system-ui, sans-serif`;
    g.textBaseline = 'bottom';
    // zone bands: what is in reach, and what is not yet
    for (const z of this.zones) {
      const y = this.yOf(Math.max(z.minCastRange, 0.001)) * H;
      const inReach = tg.reach >= z.minCastRange;
      if (z.minCastRange > 0) {
        g.strokeStyle = `rgba(255,255,255,${inReach ? 0.4 : 0.22})`;
        g.setLineDash([W * 0.02, W * 0.02]);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
        g.setLineDash([]);
      }
      g.textAlign = 'left';
      g.fillStyle = `rgba(255,255,255,${inReach ? 0.8 : 0.45})`;
      const why = reach < z.minCastRange ? ' · out of range' : ' · too dark';
      g.fillText(z.name + (inReach ? '' : why), W * 0.04, y - 3);
    }
    // flight path
    g.strokeStyle = 'rgba(255,255,255,0.75)';
    g.lineWidth = Math.max(1.5, W * 0.005);
    g.setLineDash([W * 0.012, W * 0.02]);
    g.beginPath();
    g.moveTo(tip.x * W, tip.y * H);
    g.quadraticCurveTo(((tip.x + tg.x) / 2) * W, (Math.min(tip.y, tg.y) - 0.12 - 0.1 * tg.d) * H, tg.x * W, tg.y * H);
    g.stroke();
    g.setLineDash([]);
    // landing marker
    const sc = this.scaleAt(tg.y);
    const pulse = 1 + 0.08 * Math.sin(this.t * 8);
    g.strokeStyle = '#fff';
    g.lineWidth = Math.max(2, W * 0.006);
    g.beginPath();
    g.ellipse(tg.x * W, tg.y * H, W * 0.05 * sc * pulse, W * 0.018 * sc * pulse, 0, 0, 7);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fill();
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.font = `700 ${Math.round(small * 1.1)}px ui-rounded, system-ui, sans-serif`;
    const label = this.zoneAt(tg.d).name;
    g.shadowColor = 'rgba(0,0,0,0.5)';
    g.shadowBlur = 6;
    g.fillText(label, clamp(tg.x, 0.2, 0.8) * W, tg.y * H - W * 0.035);
    g.shadowBlur = 0;
    void L;
  }

  private gaugeFrame(g: G, y: number, h: number): { x: number; w: number } {
    const { W } = this;
    const w = W * 0.78;
    const x = (W - w) / 2;
    g.fillStyle = 'rgba(12,24,34,0.55)';
    g.beginPath();
    g.roundRect(x - 8, y - 8, w + 16, h + 16, 12);
    g.fill();
    return { x, w };
  }

  private drawTension(g: G, f: FightState): void {
    const { W, H } = this;
    const b = this.host.store.content.balance.fight;
    const y = H * 0.135;
    const h = Math.max(14, H * 0.02);
    const shake = f.tension > b.redAt ? (this.fx.next() - 0.5) * 6 : 0;
    g.save();
    g.translate(shake, 0);
    const { x, w } = this.gaugeFrame(g, y, h + H * 0.03);
    const max = 1.1;
    const seg = (from: number, to: number, color: string) => {
      g.fillStyle = color;
      g.fillRect(x + (w * from) / max, y, (w * (to - from)) / max, h);
    };
    const yellowAt = b.yellowAt + 0.1 * f.greenBonus;
    seg(0, b.greenAt, '#5b7f95');
    seg(b.greenAt, yellowAt, '#4fc27a');
    seg(yellowAt, b.redAt, '#f0c341');
    seg(b.redAt, max, '#e2513f');
    // needle
    const nx = x + (w * clamp(f.tension, 0, max)) / max;
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(nx, y + h * 0.2);
    g.lineTo(nx - h * 0.5, y - h * 0.55);
    g.lineTo(nx + h * 0.5, y - h * 0.55);
    g.fill();
    g.fillRect(nx - 1.5, y, 3, h);
    // snap and slack warnings fill up
    if (f.redTime > 0) {
      g.fillStyle = `rgba(255,255,255,${0.35 + 0.3 * Math.sin(this.t * 25)})`;
      g.fillRect(x + (w * b.redAt) / max, y, ((w * (max - b.redAt)) / max) * clamp(f.redTime / b.snapS, 0, 1), h);
    }
    if (f.slackTime > 0.3) {
      g.fillStyle = `rgba(255,255,255,${0.3 + 0.25 * Math.sin(this.t * 14)})`;
      g.fillRect(x, y, ((w * b.greenAt) / max) * clamp(f.slackTime / b.slackS, 0, 1), h);
    }
    // line out: the fish working its way in (left) or out (right)
    const ly = y + h + H * 0.016;
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(x, ly, w, 3);
    g.fillStyle = '#fff';
    const fx = x + w * clamp(f.dist / f.capacity, 0, 1);
    g.beginPath();
    g.moveTo(fx - 9, ly + 1.5);
    g.lineTo(fx + 3, ly - 5);
    g.lineTo(fx + 3, ly + 8);
    g.fill();
    g.beginPath();
    g.moveTo(fx + 3, ly + 1.5);
    g.lineTo(fx + 10, ly - 4);
    g.lineTo(fx + 10, ly + 7);
    g.fill();
    g.font = `600 ${Math.round(Math.max(10, W * 0.026))}px ui-rounded, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillText('landed', x, ly + 14);
    g.textAlign = 'right';
    g.fillText('gone', x + w, ly + 14);
    g.restore();
  }

  private drawLureGauge(g: G): void {
    const { W, H } = this;
    const lure = this.rig()?.lure?.lure;
    if (!lure) return;
    const y = H * 0.135;
    const h = Math.max(14, H * 0.02);
    const { x, w } = this.gaugeFrame(g, y, h);
    g.fillStyle = '#5b7f95';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#4fc27a';
    g.fillRect(x + w * lure.speedBand[0], y, w * (lure.speedBand[1] - lure.speedBand[0]), h);
    const nx = x + w * clamp(this.lure.speed, 0, 1);
    g.fillStyle = '#fff';
    g.fillRect(nx - 2, y - 4, 4, h + 8);
    g.font = `600 ${Math.round(Math.max(10, W * 0.026))}px ui-rounded, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText('slow', x + 4, y + h / 2);
    g.textAlign = 'right';
    g.fillText('fast', x + w - 4, y + h / 2);
  }

  private drawHint(g: G, text: string, alpha: number): void {
    const { W, H } = this;
    g.save();
    g.globalAlpha = alpha;
    g.font = `600 ${Math.round(Math.max(13, W * 0.037))}px ui-rounded, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const tw = g.measureText(text).width;
    g.fillStyle = 'rgba(12,24,34,0.6)';
    g.beginPath();
    g.roundRect(W / 2 - tw / 2 - 14, H * 0.225 - 16, tw + 28, 32, 16);
    g.fill();
    g.fillStyle = '#fff';
    g.fillText(text, W / 2, H * 0.225);
    g.restore();
  }
}
