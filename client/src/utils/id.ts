import { customAlphabet } from "nanoid";
import { readSessionStorage, removeSessionStorage, writeSessionStorage } from "./storage";

// URL-safe, no ambiguous characters, short enough to be a clean shareable link.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

export const generateRoomId = customAlphabet(alphabet, 10);
export const generatePeerId = customAlphabet(alphabet, 16);
export const generateTaskId = customAlphabet(alphabet, 12);

/**
 * This tab's identity in a given room, stable across a reload of that same
 * tab (sessionStorage, not localStorage — must not leak to other tabs).
 * Without this, a reload would look to the server like a brand-new
 * participant every time, losing whatever role you held.
 */
export function getOrCreatePeerId(roomId: string): string {
  const key = `peer:${roomId}`;
  const existing = readSessionStorage<string>(key);
  if (existing) return existing;
  const fresh = generatePeerId();
  writeSessionStorage(key, fresh);
  return fresh;
}

/** Forgets this tab's identity in a room — used when kicked, so a reload doesn't silently resume the removed participant's old seat. */
export function clearRoomIdentity(roomId: string): void {
  removeSessionStorage(`peer:${roomId}`);
  removeSessionStorage(`join-name:${roomId}`);
}
