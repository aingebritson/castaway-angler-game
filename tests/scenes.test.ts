import { describe, expect, it } from 'vitest';
import { loadContentNode } from '../src/content/loadNode';
import { IDENTITY, coverFit, fitX, fitY, sceneHorizon } from '../src/scenes/fit';

const { content } = loadContentNode();
const ART = { w: 1290, h: 2796 };

describe('coverFit', () => {
  it('is the identity when the screen has the art’s shape', () => {
    const f = coverFit(375, 375 * (ART.h / ART.w), ART.w, ART.h);
    expect(f.ox).toBeCloseTo(0);
    expect(f.oy).toBeCloseTo(0);
    expect(f.sx).toBeCloseTo(1);
    expect(f.sy).toBeCloseTo(1);
  });

  it('crops the top and bottom on a wider screen (iPhone SE)', () => {
    const f = coverFit(375, 667, ART.w, ART.h);
    expect(f.sx).toBeCloseTo(1);
    expect(f.sy).toBeGreaterThan(1);
    expect(fitY(f, 0.5)).toBeCloseTo(0.5);
    expect(fitY(f, 0)).toBeLessThan(0);
    expect(fitY(f, 0.33)).toBeLessThan(0.33);
  });

  it('crops the sides on a narrower screen', () => {
    const f = coverFit(360, 900, ART.w, ART.h);
    expect(f.sy).toBeCloseTo(1);
    expect(f.sx).toBeGreaterThan(1);
    expect(fitX(f, 0.5)).toBeCloseTo(0.5);
    expect(fitX(f, 0.11)).toBeLessThan(0.11);
  });

  it('falls back to the identity for an empty screen or image', () => {
    expect(coverFit(0, 800, ART.w, ART.h)).toEqual(IDENTITY);
    expect(coverFit(375, 812, 0, 0)).toEqual(IDENTITY);
  });
});

describe('sceneHorizon', () => {
  const scene = content.locations['rocky-point'].scene;
  const top = Math.min(...scene.waterPolygon.map((p) => p[1]));

  it('takes the top of the water polygon when the art fills a phone-shaped screen', () => {
    expect(sceneHorizon(scene, 0.42, IDENTITY)).toBe(top);
  });

  it('moves the horizon with the fit on other screen shapes', () => {
    const f = coverFit(768, 1024, ART.w, ART.h);
    expect(sceneHorizon(scene, 0.42, f)).toBeCloseTo(fitY(f, top));
  });

  it("keeps the painter's horizon for placeholder art", () => {
    expect(sceneHorizon(scene, 0.42, null)).toBe(0.42);
  });

  it("keeps the painter's horizon when the scene has no water polygon", () => {
    expect(sceneHorizon({ ...scene, waterPolygon: [] }, 0.36, IDENTITY)).toBe(0.36);
  });

  it('every castable location has a water polygon with a plausible horizon', () => {
    for (const loc of Object.values(content.locations)) {
      if (!loc.zones.some((z) => z.cast)) continue;
      const t = Math.min(...loc.scene.waterPolygon.map((p) => p[1]));
      expect(t, loc.id).toBeGreaterThan(0.15);
      expect(t, loc.id).toBeLessThan(0.6);
    }
  });
});
