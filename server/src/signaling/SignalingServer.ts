import type { WebSocket, WebSocketServer } from "ws";
import type { ClientToServerMessage, ServerToClientMessage } from "@planning-poker/shared";
import { RoomRegistry } from "./RoomRegistry.js";

function send(socket: WebSocket, message: ServerToClientMessage): void {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(message));
}

// Once a room's WebRTC handshake completes, this socket carries zero
// application traffic for the rest of the session — everything else flows
// peer-to-peer. Left alone, that idle connection gets silently dropped by
// most reverse proxies/load balancers (Fly's edge included) after ~60s,
// which looks to us like the peer disconnected and quietly deletes the
// room, even though the browser tab is still open. A protocol-level
// ping/pong (transparent to the browser — it answers pings automatically,
// with no client code needed) keeps bytes flowing so that never happens,
// and doubles as detection for genuinely dead connections.
const HEARTBEAT_INTERVAL_MS = 25_000;

export class SignalingServer {
  private registry = new RoomRegistry();
  private aliveSockets = new WeakSet<WebSocket>();

  constructor(private wss: WebSocketServer) {
    this.wss.on("connection", (socket) => this.handleConnection(socket));
    setInterval(() => this.heartbeatTick(), HEARTBEAT_INTERVAL_MS);
  }

  private handleConnection(socket: WebSocket): void {
    this.aliveSockets.add(socket);
    socket.on("pong", () => this.aliveSockets.add(socket));
    socket.on("message", (raw) => this.handleMessage(socket, raw.toString()));
    socket.on("close", () => this.handleClose(socket));
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
      send(socket, { type: "error", message: "Malformed message" });
      return;
    }

    switch (message.type) {
      case "create-room":
        this.registry.createRoom(message.roomId, message.peerId, socket);
        send(socket, { type: "room-created", roomId: message.roomId });
        break;

      case "join-room": {
        const room = this.registry.getRoom(message.roomId);
        if (!room || !room.hostPeerId) {
          send(socket, { type: "room-not-found", roomId: message.roomId });
          return;
        }
        this.registry.addPeer(message.roomId, message.peerId, socket);
        send(socket, { type: "room-joined", roomId: message.roomId, hostPeerId: room.hostPeerId });
        break;
      }

      case "offer":
      case "answer":
      case "ice-candidate": {
        const target = this.registry.getPeerSocket(message.roomId, message.toPeerId);
        if (!target) return;
        if (message.type === "offer") {
          send(target, { type: "offer", fromPeerId: message.fromPeerId, sdp: message.sdp });
        } else if (message.type === "answer") {
          send(target, { type: "answer", fromPeerId: message.fromPeerId, sdp: message.sdp });
        } else {
          send(target, { type: "ice-candidate", fromPeerId: message.fromPeerId, candidate: message.candidate });
        }
        break;
      }

      case "claim-host": {
        const room = this.registry.getRoom(message.roomId);
        if (!room) {
          send(socket, { type: "claim-ack", accepted: false });
          return;
        }
        const accepted = this.registry.claimHost(message.roomId, message.peerId, socket);
        send(socket, {
          type: "claim-ack",
          accepted,
          currentHostPeerId: accepted ? undefined : (room.hostPeerId ?? undefined),
        });
        if (accepted) {
          this.broadcastToRoom(message.roomId, { type: "host-changed", roomId: message.roomId, newHostPeerId: message.peerId });
        }
        break;
      }

      case "release-host":
        this.registry.releaseHost(message.roomId, socket);
        break;

      case "leave-room":
        this.registry.removeSocket(socket);
        break;
    }
  }

  private handleClose(socket: WebSocket): void {
    const affected = this.registry.removeSocket(socket);
    for (const { roomId, peerId, wasHost } of affected) {
      if (wasHost) {
        this.broadcastToRoom(roomId, { type: "host-disconnected", roomId, oldHostPeerId: peerId });
      }
    }
  }

  private broadcastToRoom(roomId: string, message: ServerToClientMessage): void {
    const room = this.registry.getRoom(roomId);
    if (!room) return;
    for (const peerSocket of room.peers.values()) {
      send(peerSocket, message);
    }
  }
}
