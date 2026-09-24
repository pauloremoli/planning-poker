import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientToServerMessage, DeckConfig, ServerToClientMessage } from "@planning-poker/shared";
import { SignalingServer } from "./SignalingServer.js";

const DECK: DeckConfig = { id: "fib", label: "Fib", values: ["1", "2", "?"] };

/** Minimal stand-in for a `ws` WebSocket: enough for SignalingServer/RoomStore to drive it. */
class FakeSocket extends EventEmitter {
  readyState = 1; // OPEN
  static readonly OPEN = 1;
  readonly OPEN = 1;
  sent: ServerToClientMessage[] = [];

  send(raw: string): void {
    this.sent.push(JSON.parse(raw));
  }

  ping(): void {}
  terminate(): void {
    this.emit("close");
  }

  receive(message: ClientToServerMessage): void {
    this.emit("message", Buffer.from(JSON.stringify(message)));
  }

  lastState(): unknown {
    for (let i = this.sent.length - 1; i >= 0; i--) {
      const m = this.sent[i];
      if (m.type === "room-state") return m.state;
    }
    return undefined;
  }
}

class FakeWebSocketServer extends EventEmitter {
  clients = new Set<FakeSocket>();

  connect(): FakeSocket {
    const socket = new FakeSocket();
    this.clients.add(socket);
    this.emit("connection", socket);
    return socket;
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SignalingServer", () => {
  it("routes connect-room and room-action messages end to end", () => {
    const wss = new FakeWebSocketServer();
    new SignalingServer(wss as any);

    const host = wss.connect();
    host.receive({ type: "connect-room", roomId: "room1", peerId: "host", name: "Host", createWithDeck: DECK });
    expect((host.lastState() as { hostPeerId: string }).hostPeerId).toBe("host");

    const peer = wss.connect();
    peer.receive({ type: "connect-room", roomId: "room1", peerId: "peer", name: "Peer" });
    expect((peer.lastState() as { participants: unknown[] }).participants).toHaveLength(2);

    peer.receive({ type: "room-action", roomId: "room1", action: { type: "vote-cast", peerId: "peer", value: "2" } });
    const state = host.lastState() as { participants: { peerId: string; vote: string | null }[] };
    expect(state.participants.find((p) => p.peerId === "peer")?.vote).toBe("2");
  });

  it("replies with an error for malformed JSON instead of crashing", () => {
    const wss = new FakeWebSocketServer();
    new SignalingServer(wss as any);
    const socket = wss.connect();
    socket.emit("message", Buffer.from("not json"));
    expect(socket.sent).toEqual([{ type: "error", message: "Malformed message" }]);
  });

  it("disconnects and re-adds a participant across a socket close/reconnect within the grace period", () => {
    const wss = new FakeWebSocketServer();
    new SignalingServer(wss as any);

    const host = wss.connect();
    host.receive({ type: "connect-room", roomId: "room1", peerId: "host", name: "Host", createWithDeck: DECK });
    const peer = wss.connect();
    peer.receive({ type: "connect-room", roomId: "room1", peerId: "peer", name: "Peer" });

    peer.emit("close");
    expect((host.lastState() as { participants: { peerId: string; connected: boolean }[] }).participants.find((p) => p.peerId === "peer")?.connected).toBe(
      false
    );

    const reconnected = wss.connect();
    reconnected.receive({ type: "connect-room", roomId: "room1", peerId: "peer", name: "Peer" });
    vi.advanceTimersByTime(5_000); // past RECONNECT_GRACE_MS

    const finalState = host.lastState() as { participants: { peerId: string; connected: boolean }[] };
    expect(finalState.participants.map((p) => p.peerId)).toEqual(["host", "peer"]);
    expect(finalState.participants.find((p) => p.peerId === "peer")?.connected).toBe(true);
  });

  it("terminates and removes sockets that missed a heartbeat pong", () => {
    const wss = new FakeWebSocketServer();
    new SignalingServer(wss as any);

    const host = wss.connect();
    host.receive({ type: "connect-room", roomId: "room1", peerId: "host", name: "Host", createWithDeck: DECK });

    // First tick: pinged, marked not-yet-ponged.
    vi.advanceTimersByTime(25_000);
    // Second tick without a pong in between: terminated.
    const terminateSpy = vi.spyOn(host, "terminate");
    vi.advanceTimersByTime(25_000);
    expect(terminateSpy).toHaveBeenCalled();
  });
});
