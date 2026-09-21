import { customAlphabet } from "nanoid";

// URL-safe, no ambiguous characters, short enough to be a clean shareable link.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

export const generateRoomId = customAlphabet(alphabet, 10);
export const generatePeerId = customAlphabet(alphabet, 16);
export const generateTaskId = customAlphabet(alphabet, 12);
