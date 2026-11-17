/**
 * Art manifest. Every asset id resolves through here; a missing file falls
 * back to placeholder art drawn in code, so art never blocks the build.
 */
let manifest: Record<string, string> = {};
const images = new Map<string, HTMLImageElement | null>();

export async function loadManifest(): Promise<void> {
  try {
    const res = await fetch('./art/manifest.json', { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = {};
  }
}

export function assetUrl(id: string): string | null {
  return manifest[id] ? `./art/${manifest[id]}` : null;
}

/** A loaded image for the id, or null while loading or when there is no art yet. */
export function assetImage(id: string): HTMLImageElement | null {
  if (images.has(id)) return images.get(id) ?? null;
  const url = assetUrl(id);
  if (!url) {
    images.set(id, null);
    return null;
  }
  images.set(id, null);
  const img = new Image();
  img.onload = () => images.set(id, img);
  img.src = url;
  return null;
}
