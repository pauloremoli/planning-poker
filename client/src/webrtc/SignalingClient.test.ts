import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignalingClient } from "./SignalingClient.js";

class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];

  constructor(public url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  serverClose(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
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
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("SignalingClient", () => {
  it("queues sends until the socket opens, then flushes in order", () => {
    const client = new SignalingClient("ws://test");
    client.send({ type: "connect-room", roomId: "r1", peerId: "p1", name: "A" });
    client.send({ type: "room-action", roomId: "r1", action: { type: "rename", peerId: "p1", name: "B" } });
    expect(latest().sent).toEqual([]);

    latest().open();
    expect(latest().sent.map((s) => JSON.parse(s).type)).toEqual(["connect-room", "room-action"]);
  });

  it("sends immediately once already open", () => {
    const client = new SignalingClient("ws://test");
    latest().open();
    client.send({ type: "connect-room", roomId: "r1", peerId: "p1", name: "A" });
    expect(latest().sent).toHaveLength(1);
  });

  it("delivers incoming messages to onMessage handlers", () => {
    const client = new SignalingClient("ws://test");
    const received: unknown[] = [];
    client.onMessage((m) => received.push(m));
    latest().receive({ type: "room-not-found" });
    expect(received).toEqual([{ type: "room-not-found" }]);
  });

  it("ignores malformed frames instead of throwing", () => {
    const client = new SignalingClient("ws://test");
    const received: unknown[] = [];
    client.onMessage((m) => received.push(m));
    latest().dispatchEvent(new MessageEvent("message", { data: "not json" }));
    expect(received).toEqual([]);
  });

  it("fires onOpen on the initial connection and again after a reconnect", () => {
    const client = new SignalingClient("ws://test");
    const opens = vi.fn();
    client.onOpen(opens);

    latest().open();
    expect(opens).toHaveBeenCalledTimes(1);

    latest().serverClose();
    vi.advanceTimersByTime(1000);
    latest().open();
    expect(opens).toHaveBeenCalledTimes(2);
  });

  it("fires onClose and reconnects with backoff after an unexpected drop", () => {
    const client = new SignalingClient("ws://test");
    const closes = vi.fn();
    client.onClose(closes);
    latest().open();

    const firstSocket = latest();
    firstSocket.serverClose();
    expect(closes).toHaveBeenCalledTimes(1);
    expect(FakeWebSocket.instances).toHaveLength(1); // reconnect not yet attempted

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("does not reconnect or fire onClose after a deliberate close()", () => {
    const client = new SignalingClient("ws://test");
    const closes = vi.fn();
    client.onClose(closes);
    latest().open();

    client.close();
    vi.advanceTimersByTime(10_000);
    expect(closes).not.toHaveBeenCalled();
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("unsubscribing a handler stops further delivery", () => {
    const client = new SignalingClient("ws://test");
    const received: unknown[] = [];
    const unsub = client.onMessage((m) => received.push(m));
    unsub();
    latest().receive({ type: "room-not-found" });
    expect(received).toEqual([]);
  });
});
