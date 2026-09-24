import { vi } from "vitest";
import type { RoomContextValue } from "../context/RoomContext";

/** A fully-populated RoomContextValue with every action as a spy, so a test only needs to override what it cares about. */
export function createMockRoom(overrides: Partial<RoomContextValue> = {}): RoomContextValue {
  return {
    state: null,
    status: "connected",
    myPeerId: "me",
    isHost: false,
    isSpectator: false,
    canControlRound: false,
    castVote: vi.fn(),
    rename: vi.fn(),
    setSpectator: vi.fn(),
    reveal: vi.fn(),
    reset: vi.fn(),
    nextTask: vi.fn(),
    setDeck: vi.fn(),
    setAutoReveal: vi.fn(),
    addTask: vi.fn(),
    editTask: vi.fn(),
    removeTask: vi.fn(),
    moveTask: vi.fn(),
    setCurrentTask: vi.fn(),
    grantAdmin: vi.fn(),
    revokeAdmin: vi.fn(),
    transferHost: vi.fn(),
    kickParticipant: vi.fn(),
    ...overrides,
  };
}
