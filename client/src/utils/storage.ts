// Thin localStorage/sessionStorage wrappers. Everything here is scoped to
// this browser only — never sent to the server, never read by anyone but
// the browser it was written in.

const PREFIX = "planning-poker:";

function read<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(storage: Storage, key: string, value: T): void {
  try {
    storage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently,
    // it's a convenience feature, not a requirement.
  }
}

function remove(storage: Storage, key: string): void {
  try {
    storage.removeItem(PREFIX + key);
  } catch {
    // Storage unavailable — nothing to clean up.
  }
}

/** Persists across tabs and browser restarts — for cross-session preferences like your display name or default deck. */
export function readStorage<T>(key: string): T | null {
  return read(window.localStorage, key);
}

export function writeStorage<T>(key: string, value: T): void {
  write(window.localStorage, key, value);
}

/** Scoped to this one tab — for identity that must NOT leak between tabs (e.g. which peerId this tab is in a given room), but should survive a reload of that same tab. */
export function readSessionStorage<T>(key: string): T | null {
  return read(window.sessionStorage, key);
}

export function writeSessionStorage<T>(key: string, value: T): void {
  write(window.sessionStorage, key, value);
}

export function removeSessionStorage(key: string): void {
  remove(window.sessionStorage, key);
}
