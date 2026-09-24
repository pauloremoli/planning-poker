import type { DeckConfig } from "@planning-poker/shared";
import { PRESET_DECKS, parseVoteValue } from "@planning-poker/shared";

export { PRESET_DECKS, parseVoteValue };

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
