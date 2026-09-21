import { useEffect, useRef, useState } from "react";
import type { DeckConfig, RoomState } from "@planning-poker/shared";
import { ConnectionManager, type ConnectionStatus } from "../webrtc/ConnectionManager";
import { generatePeerId } from "../utils/id";

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
 * Instantiates and owns one ConnectionManager for the lifetime of this
 * room mount, either creating a fresh room (mode "create") or joining an
 * existing one (mode "join"), and mirrors its state/status into React.
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
  const myPeerIdRef = useRef<string>(generatePeerId());

  useEffect(() => {
    if (!name || !roomId) return;

    const manager = new ConnectionManager({ signalingUrl: signalingUrl(), peerId: myPeerIdRef.current, name });
    managerRef.current = manager;

    const unsubState = manager.onStateChange(setState);
    const unsubStatus = manager.onStatusChange(setStatus);

    if (mode === "create") {
      manager.createRoom(roomId, createDeck ?? { id: "fibonacci", label: "Fibonacci", values: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"] });
    } else {
      manager.joinRoom(roomId);
    }

    return () => {
      unsubState();
      unsubStatus();
      manager.dispose();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomId, name]);

  return { manager: managerRef.current, state, status, myPeerId: myPeerIdRef.current };
}
