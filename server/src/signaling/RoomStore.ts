import type { WebSocket } from "ws";
import type { DeckConfig, RoomAction, RoomState, ServerToClientMessage } from "@planning-poker/shared";
import { AUTO_REVEAL_DELAY_MS, addParticipant, applyAction, everyoneVoted, removeParticipant } from "@planning-poker/shared";

// Each room's RoomState lives here in process memory, in exactly one place —
// this server is the sole authority. Nothing here ever touches disk; a room
// disappears the moment its last participant's grace period expires. Since
// state lives only in this one process, the app requires exactly one running
// server instance — a second instance would hold its own inconsistent copy
// of every room. (Enforced today via `fly deploy --ha=false` / min_machines
// settings — see fly.toml and .github/workflows/deploy.yml.)

/** How long a disconnected participant's seat is held before they're actually removed — long enough for a page reload's brief connect/reconnect gap, short enough that a genuine departure clears out promptly. */
const RECONNECT_GRACE_MS = 5000;

interface RoomEntry {
  state: RoomState;
  sockets: Map<string, WebSocket>;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  autoRevealTimer: ReturnType<typeof setTimeout> | null;
}

export class RoomStore {
  private rooms = new Map<string, RoomEntry>();

  constructor(private send: (socket: WebSocket, message: ServerToClientMessage) => void) {}

  /**
   * Idempotent connect/reconnect for one socket. Creates the room if it
   * doesn't exist and `createWithDeck` is given; resumes an already-known
   * peerId in place (role/vote/joinIndex untouched); otherwise adds a new
   * participant. Broadcasts the resulting state to the room if it changed,
   * and always replies to `socket` directly so it has the current state
   * even on a no-op reconnect.
   */
  connect(roomId: string, peerId: string, name: string, socket: WebSocket, createWithDeck?: DeckConfig): void {
    let room = this.rooms.get(roomId);

    if (!room) {
      if (!createWithDeck) {
        this.send(socket, { type: "room-not-found" });
        return;
      }
      const state: RoomState = {
        roomId,
        hostPeerId: peerId,
        deck: createWithDeck,
        revealed: false,
        round: 0,
        participants: [{ peerId, name, joinIndex: 0, role: "host", vote: null, connected: true, isSpectator: false }],
        tasks: [],
        currentTaskId: null,
        taskResults: {},
        autoRevealEnabled: true,
      };
      room = { state, sockets: new Map(), disconnectTimers: new Map(), autoRevealTimer: null };
      this.rooms.set(roomId, room);
    }

    this.clearDisconnectTimer(room, peerId);
    room.sockets.set(peerId, socket);

    const existing = room.state.participants.find((p) => p.peerId === peerId);
    if (existing) {
      if (!existing.connected) {
        this.setState(roomId, room, {
          ...room.state,
          participants: room.state.participants.map((p) => (p.peerId === peerId ? { ...p, connected: true } : p)),
        });
      } else {
        // Nothing changed (e.g. duplicate connect) — this socket still needs the current state.
        this.send(socket, { type: "room-state", state: room.state });
      }
      return;
    }

    this.setState(roomId, room, addParticipant(room.state, peerId, name));
  }

  /** Applies one participant action; broadcasts the resulting state if it changed. */
  apply(roomId: string, action: RoomAction): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const next = applyAction(room.state, action);
    if (next === room.state) return;

    const kickedPeerId = action.type === "request-kick" && !next.participants.some((p) => p.peerId === action.targetPeerId) ? action.targetPeerId : null;

    this.setState(roomId, room, next);

    if (kickedPeerId) {
      const targetSocket = room.sockets.get(kickedPeerId);
      if (targetSocket) this.send(targetSocket, { type: "kicked" });
      room.sockets.delete(kickedPeerId);
      this.clearDisconnectTimer(room, kickedPeerId);
    }
  }

  /** Called when a socket closes. Marks the participant disconnected immediately (broadcast) and starts the grace timer before actually removing them. */
  disconnect(socket: WebSocket): void {
    for (const [roomId, room] of this.rooms) {
      for (const [peerId, s] of room.sockets) {
        if (s !== socket) continue;
        room.sockets.delete(peerId);

        const stillPresent = room.state.participants.some((p) => p.peerId === peerId);
        if (stillPresent) {
          this.setState(roomId, room, {
            ...room.state,
            participants: room.state.participants.map((p) => (p.peerId === peerId ? { ...p, connected: false } : p)),
          });
          const timer = setTimeout(() => this.finalizeDisconnect(roomId, peerId), RECONNECT_GRACE_MS);
          room.disconnectTimers.set(peerId, timer);
        }
        return;
      }
    }
  }

  private finalizeDisconnect(roomId: string, peerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.disconnectTimers.delete(peerId);
    if (room.sockets.has(peerId)) return; // reconnected in the meantime

    this.setState(roomId, room, removeParticipant(room.state, peerId));

    if (room.state.participants.length === 0) {
      if (room.autoRevealTimer) clearTimeout(room.autoRevealTimer);
      this.rooms.delete(roomId);
    }
  }

  private clearDisconnectTimer(room: RoomEntry, peerId: string): void {
    const timer = room.disconnectTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(peerId);
    }
  }

  private setState(roomId: string, room: RoomEntry, next: RoomState): void {
    room.state = next;
    for (const socket of room.sockets.values()) this.send(socket, { type: "room-state", state: next });
    this.checkAutoReveal(roomId, room);
  }

  // ---- Auto-reveal ----
  // When enabled, the room auto-reveals once every active (non-spectator)
  // participant has voted, after a short grace delay — long enough that a
  // stale timer firing after the round moved on is a safe no-op (checked
  // again on fire).

  private checkAutoReveal(roomId: string, room: RoomEntry): void {
    if (!room.state.autoRevealEnabled || room.state.revealed || !everyoneVoted(room.state)) {
      if (room.autoRevealTimer) {
        clearTimeout(room.autoRevealTimer);
        room.autoRevealTimer = null;
      }
      return;
    }
    if (room.autoRevealTimer) return; // already counting down

    const targetRound = room.state.round;
    room.autoRevealTimer = setTimeout(() => {
      room.autoRevealTimer = null;
      const current = this.rooms.get(roomId);
      if (!current || current.state.round !== targetRound || current.state.revealed) return;
      if (!current.state.autoRevealEnabled || !everyoneVoted(current.state)) return;
      // Reveal is host/admin-gated in applyAction; the room's own hostPeerId always qualifies.
      this.apply(roomId, { type: "request-reveal", peerId: current.state.hostPeerId });
    }, AUTO_REVEAL_DELAY_MS);
  }
}
