import { useCallback, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";

const KEY = "displayName";

export function useDisplayName(): [string, (name: string) => void] {
  const [name, setNameState] = useState<string>(() => readStorage<string>(KEY) ?? "");

  const setName = useCallback((next: string) => {
    setNameState(next);
    writeStorage(KEY, next);
  }, []);

  return [name, setName];
}
