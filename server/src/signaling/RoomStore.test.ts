import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebSocket } from "ws";
import type { DeckConfig, RoomState, ServerToClientMessage } from "@planning-poker/shared";
import { AUTO_REVEAL_DELAY_MS } from "@planning-poker/shared";
import { RoomStore } from "./RoomStore.js";

const DECK: DeckConfig = { id: "fib", label: "Fib", values: ["1", "2", "3", "?"] };

function fakeSocket(): WebSocket {
  return {} as WebSocket; // identity-only stand-in; RoomStore never calls methods on it directly
}

function makeStore() {
  const sent: { socket: WebSocket; message: ServerToClientMessage }[] = [];
  const store = new RoomStore((socket, message) => sent.push({ socket, message }));
  return { store, sent };
}

function lastStateFor(sent: { socket: WebSocket; message: ServerToClientMessage }[], socket: WebSocket): RoomState | undefined {
  for (let i = sent.length - 1; i >= 0; i--) {
    const { socket: s, message } = sent[i];
    if (s === socket && message.type === "room-state") return message.state;
  }
  return undefined;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("connect: creating a room", () => {
  it("creates a room with the connecting peer as host when createWithDeck is given", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "peer1", "Alice", hostSocket, DECK);

    const state = lastStateFor(sent, hostSocket);
    expect(state?.hostPeerId).toBe("peer1");
    expect(state?.deck).toBe(DECK);
    expect(state?.autoRevealEnabled).toBe(true);
    expect(state?.participants).toEqual([{ peerId: "peer1", name: "Alice", joinIndex: 0, role: "host", vote: null, connected: true, isSpectator: false }]);
  });

  it("replies room-not-found for an unknown room with no createWithDeck", () => {
    const { store, sent } = makeStore();
    const socket = fakeSocket();
    store.connect("nope", "peer1", "Alice", socket);
    expect(sent).toEqual([{ socket, message: { type: "room-not-found" } }]);
  });

  it("a second create-room for an already-existing id does not clobber it (the original reload bug)", () => {
    const { store, sent } = makeStore();
    const firstSocket = fakeSocket();
    store.connect("room1", "peer1", "Alice", firstSocket, DECK);

    const secondSocket = fakeSocket();
    const otherDeck: DeckConfig = { id: "other", label: "Other", values: ["x"] };
    store.connect("room1", "peer2", "Mallory", secondSocket, otherDeck);

    const state = lastStateFor(sent, secondSocket)!;
    // Room keeps its original host/deck — the second "create" was just treated as a join.
    expect(state.hostPeerId).toBe("peer1");
    expect(state.deck).toBe(DECK);
    expect(state.participants.map((p) => p.peerId)).toEqual(["peer1", "peer2"]);
  });
});

describe("connect: joining and reconnecting", () => {
  it("adds a new participant to an existing room and broadcasts to everyone", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);

    const joinerSocket = fakeSocket();
    store.connect("room1", "joiner", "Joiner", joinerSocket);

    expect(lastStateFor(sent, hostSocket)?.participants.map((p) => p.peerId)).toEqual(["host", "joiner"]);
    expect(lastStateFor(sent, joinerSocket)?.participants.map((p) => p.peerId)).toEqual(["host", "joiner"]);
  });

  it("reconnecting with a known peerId resumes identity instead of duplicating", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    store.disconnect(hostSocket);

    const reconnectSocket = fakeSocket();
    store.connect("room1", "host", "Host", reconnectSocket);

    const state = lastStateFor(sent, reconnectSocket)!;
    expect(state.participants).toHaveLength(1);
    expect(state.participants[0]).toMatchObject({ peerId: "host", role: "host", connected: true });
  });

  it("a reconnect that changes nothing still replies to that socket directly", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    sent.length = 0;

    const secondSocket = fakeSocket();
    store.connect("room1", "host", "Host", secondSocket); // already connected:true, no state change
    expect(lastStateFor(sent, secondSocket)?.participants[0].peerId).toBe("host");
  });
});

describe("disconnect and reconnect grace period", () => {
  it("marks the participant disconnected immediately and broadcasts", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.disconnect(peerSocket);

    expect(lastStateFor(sent, hostSocket)?.participants.find((p) => p.peerId === "peer")?.connected).toBe(false);
  });

  it("removes the participant after the grace period if they don't reconnect", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.disconnect(peerSocket);
    vi.runAllTimers();

    expect(lastStateFor(sent, hostSocket)?.participants.map((p) => p.peerId)).toEqual(["host"]);
  });

  it("cancels removal if the same peerId reconnects within the grace period", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.disconnect(peerSocket);
    const reconnectSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", reconnectSocket);
    vi.runAllTimers();

    const state = lastStateFor(sent, hostSocket)!;
    expect(state.participants.map((p) => p.peerId)).toEqual(["host", "peer"]);
    expect(state.participants.find((p) => p.peerId === "peer")?.connected).toBe(true);
  });

  it("deletes the room once its last participant's grace period elapses", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);

    store.disconnect(hostSocket);
    vi.runAllTimers();

    // The room is gone: reconnecting the same peerId with no createWithDeck now gets room-not-found.
    sent.length = 0;
    const newSocket = fakeSocket();
    store.connect("room1", "host", "Host", newSocket);
    expect(sent).toEqual([{ socket: newSocket, message: { type: "room-not-found" } }]);
  });
});

describe("apply", () => {
  it("broadcasts the new state to every connected socket when an action changes state", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "2" });

    expect(lastStateFor(sent, hostSocket)?.participants.find((p) => p.peerId === "peer")?.vote).toBe("2");
    expect(lastStateFor(sent, peerSocket)?.participants.find((p) => p.peerId === "peer")?.vote).toBe("2");
  });

  it("does nothing for an unknown room", () => {
    const { store, sent } = makeStore();
    store.apply("ghost-room", { type: "vote-cast", peerId: "peer", value: "2" });
    expect(sent).toEqual([]);
  });

  it("does not broadcast when the action is rejected (no state change)", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    sent.length = 0;

    // A plain member has no reveal permission — "host" here has permission, use a non-privileged peer instead.
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);
    sent.length = 0;

    store.apply("room1", { type: "request-reveal", peerId: "peer" });
    expect(sent).toEqual([]);
  });

  it("kicking a participant sends them a direct 'kicked' message and drops their socket", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const targetSocket = fakeSocket();
    store.connect("room1", "target", "Target", targetSocket);
    sent.length = 0;

    store.apply("room1", { type: "request-kick", peerId: "host", targetPeerId: "target" });

    expect(sent).toContainEqual({ socket: targetSocket, message: { type: "kicked" } });
    expect(lastStateFor(sent, hostSocket)?.participants.map((p) => p.peerId)).toEqual(["host"]);

    // The target's socket was dropped from the room, so a later action from them is a no-op (unknown peer).
    sent.length = 0;
    store.apply("room1", { type: "vote-cast", peerId: "target", value: "1" });
    expect(sent).toEqual([]);
  });
});

describe("auto-reveal", () => {
  it("reveals automatically after the delay once everyone has voted", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK); // autoRevealEnabled: true by default
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.apply("room1", { type: "vote-cast", peerId: "host", value: "1" });
    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "2" });
    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(false);

    vi.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);
    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(true);
  });

  it("does not fire if disabled", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    store.apply("room1", { type: "request-set-auto-reveal", peerId: "host", enabled: false });
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.apply("room1", { type: "vote-cast", peerId: "host", value: "1" });
    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "2" });
    vi.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);

    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(false);
  });

  it("a stale timer is a no-op if the round moved on before it fired", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.apply("room1", { type: "vote-cast", peerId: "host", value: "1" });
    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "2" });
    // Round moves on (vote again) before the auto-reveal timer fires.
    store.apply("room1", { type: "request-reset", peerId: "host" });

    vi.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);
    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(false);
  });

  it("restarts the countdown for a new round after a reveal", () => {
    const { store, sent } = makeStore();
    const hostSocket = fakeSocket();
    store.connect("room1", "host", "Host", hostSocket, DECK);
    const peerSocket = fakeSocket();
    store.connect("room1", "peer", "Peer", peerSocket);

    store.apply("room1", { type: "vote-cast", peerId: "host", value: "1" });
    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "2" });
    vi.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);
    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(true);

    store.apply("room1", { type: "request-reset", peerId: "host" });
    store.apply("room1", { type: "vote-cast", peerId: "host", value: "3" });
    store.apply("room1", { type: "vote-cast", peerId: "peer", value: "1" });
    vi.advanceTimersByTime(AUTO_REVEAL_DELAY_MS);
    expect(lastStateFor(sent, hostSocket)?.revealed).toBe(true);
  });
});
