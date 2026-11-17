/** Port screens: market, tackle shop, orders board and people. Filled in with the first port. */
import type { Hotspot } from '../content/schema';

export type PortPanel = { kind: 'npc' | 'shop' | 'board' | 'market'; ref: string };

export function portHotspot(h: Hotspot): PortPanel | null {
  if (h.kind === 'npc' || h.kind === 'shop' || h.kind === 'board') return { kind: h.kind, ref: h.ref ?? '' };
  return null;
}

export function PortPanels(_props: { panel: PortPanel; onClose(): void }) {
  return null;
}
