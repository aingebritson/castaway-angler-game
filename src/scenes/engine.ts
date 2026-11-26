/**
 * The canvas: one render loop, one scene at a time. Paints the location,
 * runs the fishing interaction when the scene has castable water.
 */
import type { Location } from '../content/schema';
import { assetImage } from '../platform/assets';
import type { GameAudio } from '../platform/audio';
import { moonPhase } from '../sim/time';
import { has, sunAt } from '../state/actions';
import type { Store } from '../state/store';
import { Fishing, type FishingHost } from './fishing';
import { type Fit, IDENTITY, coverFit, sceneHorizon } from './fit';
import { type Light, css, lightFor } from './light';
import { PAINTERS, type Painter, type SceneInfo } from './painters';
import './paintersCayes';
import './paintersRio';
import { backgroundAt } from '../sim/water';
import { waterNow, zonesNow } from '../state/travel';
import type { WaterLevel } from '../content/schema';

const SEA_LEVEL: Record<string, number> = { beach: 1, 'rocky-point': 1, lagoon: 0.6, camp: 0.5, grove: 0.2 };

export class Engine {
  fishing: Fishing | null = null;
  paused = false;
  private g: CanvasRenderingContext2D;
  private W = 1;
  private H = 1;
  private raf = 0;
  private last = 0;
  private t = 0;
  private loc: Location | null = null;
  private painter: Painter | null = null;
  private light: Light | null = null;
  private lightAge = 99;
  private fade = 1;
  /** The last scene fit applied, so applyFit only acts on a change. */
  private fitKey = '';
  private info: SceneInfo;

  constructor(private canvas: HTMLCanvasElement, private store: Store, private audio: GameAudio, private host: Omit<FishingHost, 'store' | 'audio'>) {
    this.g = canvas.getContext('2d', { alpha: false })!;
    this.info = {
      has: (id) => has(this.store.state, id),
      flag: (name) => !!this.store.state.flags[name],
      rackCount: 0,
      rackSlots: 3,
      moon: 0,
      water: null,
    };
    this.resize();
    store.subscribe(() => { if (this.lightAge > 0.3) this.lightAge = 99; });
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.cancel);
  }

  private pos(e: PointerEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  private down = (e: PointerEvent) => {
    e.preventDefault();
    this.audio.unlock();
    if (this.paused || !this.fishing) return;
    this.canvas.setPointerCapture?.(e.pointerId);
    this.fishing.pointerDown(...this.pos(e));
  };
  private move = (e: PointerEvent) => {
    if (this.paused || !this.fishing) return;
    this.fishing.pointerMove(...this.pos(e));
  };
  private up = (e: PointerEvent) => {
    if (!this.fishing) return;
    this.fishing.pointerUp(...this.pos(e));
  };
  private cancel = () => this.fishing?.cancelPointer();

  resize = (): void => {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  setLocation(locationId: string): void {
    const loc = this.store.content.locations[locationId];
    if (!loc || loc === this.loc) return;
    this.fishing?.reset();
    this.loc = loc;
    this.painter = PAINTERS[loc.scene.painter] ?? PAINTERS.beach;
    this.build();
    this.fitKey = '';
    this.host.onPhase('idle');
    this.lightAge = 99;
    this.fade = 1;
  }

  start(): void {
    cancelAnimationFrame(this.raf);
    this.last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0, (ts - this.last) / 1000));
      this.last = ts;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
  }

  /** The fishing interaction for this place as the water stands now: the flood pulse can add or take away zones. */
  private build(): void {
    const loc = this.loc!;
    const ctx = this.store.ctx();
    this.info.water = waterNow(ctx, loc.regionId);
    const now = { ...loc, zones: zonesNow(ctx, loc.id) };
    const castable = now.zones.some((z) => z.cast);
    // starts on the painter's horizon; frame() refits it once the art has loaded
    this.fishing = castable ? new Fishing(now, this.painter!.horizon, { store: this.store, audio: this.audio, ...this.host }) : null;
  }

  /**
   * Scene data is in image coordinates; map it onto this screen. Moves the
   * fishing horizon and publishes the fit as CSS variables, which place the
   * hotspot buttons. Runs every frame but only acts when the fit changes
   * (resize, art finished loading, new location).
   */
  private applyFit(fit: Fit | null): void {
    const f = fit ?? IDENTITY;
    const key = fit ? `${f.ox.toFixed(4)} ${f.oy.toFixed(4)} ${f.sx.toFixed(4)} ${f.sy.toFixed(4)}` : 'none';
    if (key === this.fitKey || !this.loc || !this.painter) return;
    this.fitKey = key;
    const style = this.canvas.parentElement?.style;
    if (style) for (const k of ['ox', 'oy', 'sx', 'sy'] as const) style.setProperty(`--fit-${k}`, String(f[k]));
    this.fishing?.setHorizon(sceneHorizon(this.loc.scene, this.painter.horizon, fit));
  }

  private frame(dt: number): void {
    const { g, W, H } = this;
    const loc = this.loc;
    const painter = this.painter;
    if (!loc || !painter) return;
    this.t += dt;
    this.lightAge += dt;
    const s = this.store.state;
    if (!this.light || this.lightAge > 2) {
      const ctx = this.store.ctx();
      const sun = sunAt(ctx, loc.id);
      const torch = sun.phase === 'night' && (has(s, 'torch') || has(s, 'lantern')) && loc.zones.some((z) => z.cast);
      this.light = lightFor(sun, torch);
      this.info.moon = moonPhase(ctx.now);
      this.lightAge = 0;
      this.audio.ambient(SEA_LEVEL[loc.scene.painter] ?? 0.6, this.light.night);
      // the month turned (or the debug clock moved): the river may have risen or fallen
      const water: WaterLevel | null = waterNow(ctx, loc.regionId);
      if (water !== this.info.water) {
        this.fishing?.reset();
        this.build();
        this.fitKey = '';
      }
    }
    this.info.rackCount = s.rack.length;
    const L = this.light;
    const p = { g, W, H, t: this.t, L, info: this.info };

    g.globalAlpha = 1;
    const bg = assetImage(backgroundAt(loc, this.info.water));
    this.applyFit(bg ? coverFit(W, H, bg.width, bg.height) : null);
    if (bg) {
      // real art: cover-fit, then shade for the hour
      const k = Math.max(W / bg.width, H / bg.height);
      g.drawImage(bg, (W - bg.width * k) / 2, (H - bg.height * k) / 2, bg.width * k, bg.height * k);
      g.save();
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = css(L.tint);
      g.fillRect(0, 0, W, H);
      g.restore();
    } else painter.paint(p);

    if (this.fishing) {
      if (!this.paused) this.fishing.update(dt, W, H);
      this.fishing.drawWater(g, L);
    }
    if (!bg) painter.front?.(p);
    this.fishing?.drawOver(g, L);

    // a little vignette to seat the interface
    const v = g.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(0,0,0,0.28)');
    v.addColorStop(0.14, 'rgba(0,0,0,0)');
    v.addColorStop(0.86, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.34)');
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);

    if (this.fade > 0) {
      this.fade = Math.max(0, this.fade - dt * 2.4);
      g.fillStyle = `rgba(8,16,24,${this.fade})`;
      g.fillRect(0, 0, W, H);
    }
  }
}
