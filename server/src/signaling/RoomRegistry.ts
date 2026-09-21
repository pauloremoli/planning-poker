import type { WebSocket } from "ws";

// Pure routing table, kept entirely in process memory. It holds no names,
// no votes, no application data of any kind — only which socket currently
// represents which peerId in which room, so offers/answers/ICE candidates
// can be relayed. Entries disappear the instant a room empties out; nothing
// here ever touches disk.

interface RoomEntry {
  hostPeerId: string | null;
  hostSocket: WebSocket | null;
  peers: Map<string, WebSocket>;
}

export class RoomRegistry {
  private rooms = new Map<string, RoomEntry>();

  createRoom(roomId: string, hostPeerId: string, hostSocket: WebSocket): void {
    this.rooms.set(roomId, {
      hostPeerId,
      hostSocket,
      peers: new Map([[hostPeerId, hostSocket]]),
    });
  }

  getRoom(roomId: string): RoomEntry | undefined {
    return this.rooms.get(roomId);
  }

  addPeer(roomId: string, peerId: string, socket: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.peers.set(peerId, socket);
  }

  getPeerSocket(roomId: string, peerId: string): WebSocket | undefined {
    return this.rooms.get(roomId)?.peers.get(peerId);
  }

  /** Frees the host slot without removing the peer, so a subsequent claimHost from the chosen successor can succeed. Only the current host socket may do this. */
  releaseHost(roomId: string, socket: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room || room.hostSocket !== socket) return;
    room.hostSocket = null;
    room.hostPeerId = null;
  }

  /** Compare-and-swap: claims the host slot only if it's currently empty. Returns whether the claim succeeded. */
  claimHost(roomId: string, peerId: string, socket: WebSocket): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.hostSocket !== null) return false;
    room.hostPeerId = peerId;
    room.hostSocket = socket;
    return true;
  }

  /**
   * Removes a socket from every room it participates in (a peer only ever
   * belongs to one room, but we don't track that mapping separately here
   * since room count stays small and this keeps the registry simpler).
   * Returns rooms where the departing socket was the host, so the caller
   * can broadcast host-disconnected.
   */
  removeSocket(socket: WebSocket): { roomId: string; peerId: string; wasHost: boolean }[] {
    const affected: { roomId: string; peerId: string; wasHost: boolean }[] = [];

    for (const [roomId, room] of this.rooms) {
      for (const [peerId, peerSocket] of room.peers) {
        if (peerSocket !== socket) continue;

        const wasHost = room.hostSocket === socket;
        room.peers.delete(peerId);
        if (wasHost) {
          room.hostSocket = null;
          room.hostPeerId = null;
        }
        affected.push({ roomId, peerId, wasHost });

        if (room.peers.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }

    return affected;
  }

  roomCount(): number {
    return this.rooms.size;
  }
}
