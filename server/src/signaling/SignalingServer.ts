import type { WebSocket, WebSocketServer } from "ws";
import type { ClientToServerMessage, ServerToClientMessage } from "@planning-poker/shared";
import { RoomStore } from "./RoomStore.js";

// The socket carries every application message for the life of a room —
// there's no separate peer-to-peer layer. Left alone, an idle connection
// gets silently dropped by most reverse proxies/load balancers (Fly's edge
// included) after ~60s, which looks like the participant left. A
// protocol-level ping/pong (transparent to the browser — it answers pings
// automatically, no client code needed) keeps bytes flowing so that never
// happens, and doubles as detection for genuinely dead connections.
const HEARTBEAT_INTERVAL_MS = 25_000;

export class SignalingServer {
  private store = new RoomStore((socket, message) => this.send(socket, message));
  private aliveSockets = new WeakSet<WebSocket>();

  constructor(private wss: WebSocketServer) {
    this.wss.on("connection", (socket) => this.handleConnection(socket));
    setInterval(() => this.heartbeatTick(), HEARTBEAT_INTERVAL_MS);
  }

  private send(socket: WebSocket, message: ServerToClientMessage): void {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(message));
  }

  private handleConnection(socket: WebSocket): void {
    this.aliveSockets.add(socket);
    socket.on("pong", () => this.aliveSockets.add(socket));
    socket.on("message", (raw) => this.handleMessage(socket, raw.toString()));
    socket.on("close", () => this.store.disconnect(socket));
  }

  private heartbeatTick(): void {
    for (const socket of this.wss.clients) {
      if (!this.aliveSockets.has(socket)) {
        socket.terminate();
        continue;
      }
      this.aliveSockets.delete(socket);
      socket.ping();
    }
  }

  private handleMessage(socket: WebSocket, raw: string): void {
    let message: ClientToServerMessage;
    try {
      message = JSON.parse(raw);
    } catch {
      this.send(socket, { type: "error", message: "Malformed message" });
      return;
    }

    switch (message.type) {
      case "connect-room":
        this.store.connect(message.roomId, message.peerId, message.name, socket, message.createWithDeck);
        break;
      case "room-action":
        this.store.apply(message.roomId, message.action);
        break;
    }
  }
}
