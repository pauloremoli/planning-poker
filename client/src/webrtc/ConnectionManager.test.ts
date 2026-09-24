import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckConfig } from "@planning-poker/shared";
import { ConnectionManager } from "./ConnectionManager.js";

const DECK: DeckConfig = { id: "fib", label: "Fib", values: ["1", "2", "?"] };

class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  sent: unknown[] = [];

  constructor(public url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
  }

  receive(message: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(message) }));
  }
}

function latest(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function connectedManager(peerId = "p1"): ConnectionManager {
  const manager = new ConnectionManager({ signalingUrl: "ws://test", peerId, name: "Alice" });
  latest().open();
  return manager;
}

describe("ConnectionManager.connect", () => {
  it("sends connect-room with the given roomId/peerId/name/deck", () => {
    const manager = connectedManager();
    manager.connect("room1", "Alice", DECK);
    expect(latest().sent).toEqual([{ type: "connect-room", roomId: "room1", peerId: "p1", name: "Alice", createWithDeck: DECK }]);
  });

  it("emits state and 'connected' status on a room-state message", () => {
    const manager = connectedManager();
    const states: unknown[] = [];
    const statuses: string[] = [];
    manager.onStateChange((s) => states.push(s));
    manager.onStatusChange((s) => statuses.push(s));

    manager.connect("room1", "Alice", DECK);
    const roomState = { roomId: "room1", hostPeerId: "p1", participants: [] };
    latest().receive({ type: "room-state", state: roomState });

    expect(manager.getState()).toEqual(roomState);
    expect(states).toContainEqual(roomState);
    expect(statuses).toContain("connected");
  });

  it("emits 'room-not-found' status", () => {
    const manager = connectedManager();
    const statuses: string[] = [];
    manager.onStatusChange((s) => statuses.push(s));
    manager.connect("ghost", "Alice");
    latest().receive({ type: "room-not-found" });
    expect(statuses).toContain("room-not-found");
  });
});

describe("ConnectionManager actions", () => {
  function setup() {
    const manager = connectedManager();
    manager.connect("room1", "Alice", DECK);
    latest().sent = []; // discard the connect-room send
    return manager;
  }

  it("castVote sends a room-action wrapping vote-cast", () => {
    const manager = setup();
    manager.castVote("5");
    expect(latest().sent).toEqual([{ type: "room-action", roomId: "room1", action: { type: "vote-cast", peerId: "p1", value: "5" } }]);
  });

  it("addTask generates a task id and sends request-add-task", () => {
    const manager = setup();
    manager.addTask("Title", "Desc");
    const sent = latest().sent[0] as { type: string; roomId: string; action: { type: string; task: { id: string; title: string; description: string } } };
    expect(sent.action.type).toBe("request-add-task");
    expect(sent.action.task).toMatchObject({ title: "Title", description: "Desc" });
    expect(sent.action.task.id).toBeTruthy();
  });

  it.each([
    ["rename", () => connectedManagerAction((m) => m.rename("Bob")), { type: "rename", peerId: "p1", name: "Bob" }],
    ["setSpectator", () => connectedManagerAction((m) => m.setSpectator(true)), { type: "set-spectator", peerId: "p1", isSpectator: true }],
    ["reveal", () => connectedManagerAction((m) => m.reveal()), { type: "request-reveal", peerId: "p1" }],
    ["reset", () => connectedManagerAction((m) => m.reset()), { type: "request-reset", peerId: "p1" }],
    ["nextTask", () => connectedManagerAction((m) => m.nextTask()), { type: "request-next-task", peerId: "p1" }],
    ["setDeck", () => connectedManagerAction((m) => m.setDeck(DECK)), { type: "request-set-deck", peerId: "p1", deck: DECK }],
    ["setAutoReveal", () => connectedManagerAction((m) => m.setAutoReveal(false)), { type: "request-set-auto-reveal", peerId: "p1", enabled: false }],
    ["removeTask", () => connectedManagerAction((m) => m.removeTask("t1")), { type: "request-remove-task", peerId: "p1", taskId: "t1" }],
    [
      "editTask",
      () => connectedManagerAction((m) => m.editTask("t1", "New title", "New desc")),
      { type: "request-edit-task", peerId: "p1", taskId: "t1", title: "New title", description: "New desc" },
    ],
    ["moveTask", () => connectedManagerAction((m) => m.moveTask("t1", "up")), { type: "request-move-task", peerId: "p1", taskId: "t1", direction: "up" }],
    ["setCurrentTask", () => connectedManagerAction((m) => m.setCurrentTask("t1")), { type: "request-set-current-task", peerId: "p1", taskId: "t1" }],
    ["grantAdmin", () => connectedManagerAction((m) => m.grantAdmin("t1")), { type: "request-grant-admin", peerId: "p1", targetPeerId: "t1" }],
    ["revokeAdmin", () => connectedManagerAction((m) => m.revokeAdmin("t1")), { type: "request-revoke-admin", peerId: "p1", targetPeerId: "t1" }],
    ["transferHost", () => connectedManagerAction((m) => m.transferHost("t1")), { type: "request-transfer-host", peerId: "p1", targetPeerId: "t1" }],
    ["kickParticipant", () => connectedManagerAction((m) => m.kickParticipant("t1")), { type: "request-kick", peerId: "p1", targetPeerId: "t1" }],
  ])("%s sends the matching room-action", (_name, run, expectedAction) => {
    const sent = run();
    expect(sent).toEqual({ type: "room-action", roomId: "room1", action: expectedAction });
  });

  function connectedManagerAction(act: (m: ConnectionManager) => void): unknown {
    const manager = setup();
    act(manager);
    return latest().sent[0];
  }
});

describe("ConnectionManager: kicked", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("emits 'kicked' status and disposes (closes the socket, no reconnect)", () => {
    const manager = connectedManager();
    manager.connect("room1", "Alice");
    const statuses: string[] = [];
    manager.onStatusChange((s) => statuses.push(s));

    latest().receive({ type: "kicked" });

    expect(statuses).toContain("kicked");
    expect(latest().readyState).toBe(FakeWebSocket.CLOSED);
  });

  it("clears this tab's persisted identity for the room, so a reload doesn't silently resume the removed seat", () => {
    const manager = connectedManager();
    manager.connect("room1", "Alice");
    window.sessionStorage.setItem("planning-poker:peer:room1", JSON.stringify("p1"));
    window.sessionStorage.setItem("planning-poker:join-name:room1", JSON.stringify("Alice"));

    latest().receive({ type: "kicked" });

    expect(window.sessionStorage.getItem("planning-poker:peer:room1")).toBeNull();
    expect(window.sessionStorage.getItem("planning-poker:join-name:room1")).toBeNull();
  });
});

describe("ConnectionManager: reconnecting status", () => {
  it("surfaces 'reconnecting' when the underlying socket drops unexpectedly", () => {
    const manager = connectedManager();
    const statuses: string[] = [];
    manager.onStatusChange((s) => statuses.push(s));

    latest().close(); // simulates an unexpected drop (SignalingClient will schedule a reconnect internally)
    expect(statuses).toContain("reconnecting");
  });
});
