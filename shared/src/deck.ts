/** Parses a card value into a number for averaging. "½" is treated as 0.5; non-numeric cards (e.g. "?", "☕", t-shirt sizes) return null. */
export function parseVoteValue(value: string): number | null {
  if (value === "½") return 0.5;
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
