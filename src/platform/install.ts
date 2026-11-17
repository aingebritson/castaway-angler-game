/** Home Screen install detection and the service worker. */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const register = () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline play is a nicety; the game runs without it */
    });
  };
  // boot() is async, so the load event may already have fired by the time we get here
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
