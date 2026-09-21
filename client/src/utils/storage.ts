// Thin localStorage wrappers. Everything here is scoped to this browser
// origin only — never sent to the signaling server, never read by anyone
// but the browser it was written in.

const PREFIX = "planning-poker:";

export function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently,
    // it's a convenience feature, not a requirement.
  }
}
