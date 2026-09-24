import { useEffect, useMemo, useRef, useState } from "react";
import type { DeckConfig, RoomState } from "@planning-poker/shared";
import { DEFAULT_DECK } from "@planning-poker/shared";
import { ConnectionManager, type ConnectionStatus } from "../webrtc/ConnectionManager";
import { getOrCreatePeerId } from "../utils/id";

function signalingUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

interface UseRoomConnectionResult {
  manager: ConnectionManager | null;
  state: RoomState | null;
  status: ConnectionStatus;
  myPeerId: string;
}

/**
 * Instantiates and owns one ConnectionManager for the lifetime of this room
 * mount. `mode: "create"` passes a deck along so the server creates the room
 * if it doesn't exist yet; either mode is otherwise just a (re)connect —
 * `connect-room` is idempotent server-side, so a stale "create" intent after
 * a reload is a safe no-op against an already-existing room.
 */
export function useRoomConnection(
  mode: "create" | "join",
  roomId: string,
  name: string,
  createDeck?: DeckConfig
): UseRoomConnectionResult {
  const managerRef = useRef<ConnectionManager | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const myPeerId = useMemo(() => getOrCreatePeerId(roomId), [roomId]);

  useEffect(() => {
    if (!name || !roomId) return;

    const manager = new ConnectionManager({ signalingUrl: signalingUrl(), peerId: myPeerId, name });
    managerRef.current = manager;

    const unsubState = manager.onStateChange(setState);
    const unsubStatus = manager.onStatusChange(setStatus);

    manager.connect(roomId, name, mode === "create" ? (createDeck ?? DEFAULT_DECK) : undefined);

    return () => {
      unsubState();
      unsubStatus();
      manager.dispose();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomId, name, myPeerId]);

  return { manager: managerRef.current, state, status, myPeerId };
}
