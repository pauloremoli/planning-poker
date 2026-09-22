import type { DeckConfig } from "@planning-poker/shared";
import { PRESET_DECKS } from "@planning-poker/shared";

export { PRESET_DECKS };

/** Parses a card value into a number for averaging. "½" is treated as 0.5; non-numeric cards (e.g. "?", "☕", t-shirt sizes) return null. */
export function parseVoteValue(value: string): number | null {
  if (value === "½") return 0.5;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function parseCustomDeck(label: string, raw: string): DeckConfig | null {
  const values = Array.from(
    new Set(
      raw
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  ).slice(0, 20);

  if (values.length === 0) return null;

  return {
    id: `custom-${Date.now()}`,
    label: label.trim() || "Custom",
    values,
  };
}
