/**
 * Save storage: IndexedDB, with localStorage as a fallback. The only code that
 * touches browser storage.
 */
const DB = 'castaway-angler';
const STORE = 'kv';
const KEY = 'save';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbp: Promise<IDBDatabase> | null = null;
const db = () => (dbp ??= open());

export async function loadSave(): Promise<unknown | null> {
  try {
    const d = await db();
    const val = await new Promise<unknown>((resolve, reject) => {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (val) return val;
  } catch {
    /* fall through to localStorage */
  }
  try {
    const raw = localStorage.getItem(DB);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeSave(state: unknown): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return;
  } catch {
    /* fall through */
  }
  try {
    localStorage.setItem(DB, JSON.stringify(state));
  } catch {
    /* storage unavailable: the session still plays, it just will not persist */
  }
}

export async function clearSave(): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(DB);
  } catch {
    /* ignore */
  }
}

/** Ask the browser not to evict the save. WebKit weighs whether the site is a Home Screen app. */
export async function requestPersist(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}

/** Debounced writer: save on every change without hammering the disk. */
export function makeSaver(delayMs = 600): { queue(state: unknown): void; flush(): void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: unknown = null;
  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (pending) void writeSave(pending);
    pending = null;
  };
  return {
    queue(state) {
      pending = state;
      if (!timer) timer = setTimeout(flush, delayMs);
    },
    flush,
  };
}
