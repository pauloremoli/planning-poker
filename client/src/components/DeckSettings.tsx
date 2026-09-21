import { useState } from "react";
import type { DeckConfig } from "@planning-poker/shared";
import { PRESET_DECKS, parseCustomDeck } from "../utils/deck";

export default function DeckSettings({ value, onChange }: { value: DeckConfig; onChange: (deck: DeckConfig) => void }) {
  const isPreset = PRESET_DECKS.some((d) => d.id === value.id);
  const [customRaw, setCustomRaw] = useState(isPreset ? "" : value.values.join(", "));

  return (
    <div className="stack">
      <select
        value={isPreset ? value.id : "custom"}
        onChange={(e) => {
          if (e.target.value === "custom") {
            const parsed = parseCustomDeck("Custom", customRaw) ?? { id: "custom", label: "Custom", values: value.values };
            onChange(parsed);
          } else {
            const preset = PRESET_DECKS.find((d) => d.id === e.target.value);
            if (preset) onChange(preset);
          }
        }}
      >
        {PRESET_DECKS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label} ({d.values.join(" ")})
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>

      {!isPreset && (
        <input
          type="text"
          placeholder="e.g. 1, 2, 3, 5, 8, ?"
          value={customRaw}
          onChange={(e) => {
            setCustomRaw(e.target.value);
            const parsed = parseCustomDeck("Custom", e.target.value);
            if (parsed) onChange(parsed);
          }}
        />
      )}
    </div>
  );
}
