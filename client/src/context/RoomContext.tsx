import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DeckConfig, RoomState } from "@planning-poker/shared";
import { hasPermission } from "@planning-poker/shared";
import { useRoomConnection } from "../hooks/useRoomConnection";
import type { ConnectionStatus } from "../webrtc/ConnectionManager";

interface RoomContextValue {
  state: RoomState | null;
  status: ConnectionStatus;
  myPeerId: string;
  isHost: boolean;
  isAway: boolean;
  canControlRound: boolean;
  castVote: (value: string | null) => void;
  rename: (name: string) => void;
  setAway: (away: boolean) => void;
  reveal: () => void;
  reset: () => void;
  nextTask: () => void;
  setDeck: (deck: DeckConfig) => void;
  setAutoReveal: (enabled: boolean) => void;
  addTask: (title: string, description: string) => void;
  removeTask: (taskId: string) => void;
  setCurrentTask: (taskId: string) => void;
  grantAdmin: (peerId: string) => void;
  revokeAdmin: (peerId: string) => void;
  transferHost: (peerId: string) => void;
  kickParticipant: (peerId: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({
  mode,
  roomId,
  name,
  createDeck,
  children,
}: {
  mode: "create" | "join";
  roomId: string;
  name: string;
  createDeck?: DeckConfig;
  children: ReactNode;
}) {
  const { manager, state, status, myPeerId } = useRoomConnection(mode, roomId, name, createDeck);

  const value = useMemo<RoomContextValue>(() => {
    const me = state?.participants.find((p) => p.peerId === myPeerId);
    return {
      state,
      status,
      myPeerId,
      isHost: state?.hostPeerId === myPeerId,
      isAway: me?.away ?? false,
      canControlRound: me ? hasPermission(me.role, "reveal") : false,
      castVote: (value) => manager?.castVote(value),
      rename: (name) => manager?.rename(name),
      setAway: (away) => manager?.setAway(away),
      reveal: () => manager?.reveal(),
      reset: () => manager?.reset(),
      nextTask: () => manager?.nextTask(),
      setDeck: (deck) => manager?.setDeck(deck),
      setAutoReveal: (enabled) => manager?.setAutoReveal(enabled),
      addTask: (title, description) => manager?.addTask(title, description),
      removeTask: (taskId) => manager?.removeTask(taskId),
      setCurrentTask: (taskId) => manager?.setCurrentTask(taskId),
      grantAdmin: (peerId) => manager?.grantAdmin(peerId),
      revokeAdmin: (peerId) => manager?.revokeAdmin(peerId),
      transferHost: (peerId) => manager?.transferHost(peerId),
      kickParticipant: (peerId) => manager?.kickParticipant(peerId),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, state, status, myPeerId]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}
