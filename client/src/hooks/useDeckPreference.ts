import { useCallback, useState } from "react";
import type { DeckConfig } from "@planning-poker/shared";
import { DEFAULT_DECK } from "@planning-poker/shared";
import { readStorage, writeStorage } from "../utils/storage";

const KEY = "deckPreference";

export function useDeckPreference(): [DeckConfig, (deck: DeckConfig) => void] {
  const [deck, setDeckState] = useState<DeckConfig>(() => readStorage<DeckConfig>(KEY) ?? DEFAULT_DECK);

  const setDeck = useCallback((next: DeckConfig) => {
    setDeckState(next);
    writeStorage(KEY, next);
  }, []);

  return [deck, setDeck];
}
