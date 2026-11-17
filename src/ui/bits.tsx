import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { assetUrl } from '../platform/assets';
import { drawShape, shapeAspect } from '../scenes/silhouettes';
import { useGame } from './hooks';

/** Item art from the manifest, or its placeholder glyph. */
export function ItemIcon({ id, size = 28 }: { id: string; size?: number }) {
  const { store } = useGame();
  const item = store.content.items[id];
  const url = assetUrl(`item/${id}`);
  return (
    <span class="icon" style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.82}px`, lineHeight: 1 }} title={item?.name}>
      {url ? <img src={url} alt="" /> : item?.glyph ?? '❔'}
    </span>
  );
}

/**
 * Specimen art. Real art when the manifest has it; otherwise the species'
 * shape class drawn in its field colours. `ink` shows only the silhouette.
 */
export function FishArt({ speciesId, width = 220, ink = false }: { speciesId: string; width?: number; ink?: boolean }) {
  const { store } = useGame();
  const sp = store.content.species[speciesId];
  const ref = useRef<HTMLCanvasElement>(null);
  const aspect = Math.min(0.8, Math.max(0.36, shapeAspect(sp.silhouette)));
  const height = Math.round(width * aspect);
  const url = assetUrl(`specimen/${speciesId}`);
  useEffect(() => {
    const c = ref.current;
    if (!c || url) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    c.width = width * dpr;
    c.height = height * dpr;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);
    g.translate(width / 2, height / 2);
    const len = Math.min(width * 0.88, (height * 0.9) / shapeAspect(sp.silhouette));
    g.scale(len, len);
    if (ink) drawShape(g, sp.silhouette, { fill: '#3b372e', flat: true });
    else drawShape(g, sp.silhouette, { fill: sp.tint?.body ?? '#9fb0bb', accent: sp.tint?.accent });
  }, [speciesId, width, ink, url]);
  if (url) return <img src={url} alt={sp.commonName} style={{ width: `${width}px`, height: `${height}px`, objectFit: 'contain', filter: ink ? 'brightness(0) opacity(.75)' : undefined }} />;
  return <canvas ref={ref} style={{ width: `${width}px`, height: `${height}px`, display: 'block' }} />;
}

export function Sheet({ title, sub, onClose, children, tall, tabs }: { title: string; sub?: string; onClose(): void; children: ComponentChildren; tall?: boolean; tabs?: ComponentChildren }) {
  return (
    <>
      <div class="scrim" onClick={onClose} />
      <div class={`sheet ${tall ? 'tall' : ''}`}>
        <div class="sheet-head">
          <div>
            <h2>{title}</h2>
            {sub && <div class="sub">{sub}</div>}
          </div>
          <button class="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {tabs && <div class="tabs">{tabs}</div>}
        <div class="sheet-body">{children}</div>
      </div>
    </>
  );
}

export function Tab({ on, onClick, children }: { on: boolean; onClick(): void; children: ComponentChildren }) {
  return <button class={`tab ${on ? 'on' : ''}`} onClick={onClick}>{children}</button>;
}

export function Switch({ label, on, onChange }: { label: string; on: boolean; onChange(v: boolean): void }) {
  return (
    <button class={`switch ${on ? 'on' : ''}`} style={{ width: '100%' }} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <i />
    </button>
  );
}

const ICONS: Record<string, string> = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  bag: 'M6 9h12a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a2 2 0 0 1 2-2Zm3 0V6a3 3 0 0 1 6 0v3M9 14h6',
  rig: 'M14 5v9a5 5 0 0 1-10 0v-3m0 0-2 2.5M4 11l2 2.5M14 5a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 14 5Z',
  guide: 'M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5m0-13c2-1.5 5-2 8-1.5v13c-3-.5-6 0-8 1.5m0-13v13',
  journal: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6V3Zm0 0v18M4 7h2M4 12h2M4 17h2M10 8h5M10 12h5',
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-2.2-.8-.5-1.3 1-2.1-1.6-1.6-2.1 1-1.3-.5L12.5 4h-1l-.8 2.2-1.3.5-2.1-1-1.6 1.6 1 2.1-.5 1.3L4 11.5v1l2.2.8.5 1.3-1 2.1 1.6 1.6 2.1-1 1.3.5.8 2.2h1l.8-2.2 1.3-.5 2.1 1 1.6-1.6-1-2.1.5-1.3L20 13v-1Z',
};

export function Icon({ name }: { name: keyof typeof ICONS | string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

export const GRADE_LABEL: Record<string, string> = { small: 'Small', average: 'Average', large: 'Large', trophy: 'Trophy', record: 'Record' };

export const BAIT_LABEL: Record<string, string> = {
  crustacean: 'Sand flea', crab: 'Crab', cutfish: 'Cut fish', fruit: 'Coconut', shrimp: 'Shrimp', squid: 'Squid', livefish: 'Live bait', worm: 'Worm',
  feather: 'Feather', spoon: 'Spoon', jig: 'Jig', popper: 'Popper', plug: 'Plug', fly: 'Fly', trap: 'Trap', hand: 'By hand', net: 'Net',
};
