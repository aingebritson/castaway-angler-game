import type { Location } from '../content/schema';

/**
 * How scene art sits on the screen. Scene data (hotspots, the water polygon)
 * is written in image coordinates, 0..1 across the art. The art is
 * cover-fitted to a screen of any shape, so a screen point is
 * `ox + u * sx` across and `oy + v * sy` down, also 0..1.
 */
export interface Fit {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
}

/** No art: scene data maps straight onto the screen. */
export const IDENTITY: Fit = { ox: 0, oy: 0, sx: 1, sy: 1 };

/** Cover-fit an image of iw × ih, centred, onto a screen of W × H. */
export function coverFit(W: number, H: number, iw: number, ih: number): Fit {
  if (W <= 0 || H <= 0 || iw <= 0 || ih <= 0) return IDENTITY;
  const k = Math.max(W / iw, H / ih);
  const sx = (iw * k) / W;
  const sy = (ih * k) / H;
  return { ox: (1 - sx) / 2, oy: (1 - sy) / 2, sx, sy };
}

export const fitX = (f: Fit, u: number): number => f.ox + u * f.sx;
export const fitY = (f: Fit, v: number): number => f.oy + v * f.sy;

/**
 * Screen y of the horizon, where the water starts. Real scene art sets it
 * through the top of the scene's water polygon, fitted to this screen, so each
 * image can be matched after it is generated. Placeholder art (fit null) keeps
 * the horizon its painter draws, which is already in screen coordinates.
 */
export function sceneHorizon(scene: Location['scene'], painterHorizon: number, fit: Fit | null): number {
  if (!fit || scene.waterPolygon.length === 0) return painterHorizon;
  return fitY(fit, Math.min(...scene.waterPolygon.map((p) => p[1])));
}
