import type { DeckConfig, RoomAction, RoomState, ServerToClientMessage, TaskInfo } from "@planning-poker/shared";
import { SignalingClient } from "./SignalingClient";
import { clearRoomIdentity, generateTaskId } from "../utils/id";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "room-not-found" | "kicked";

/**
 * Owns this browser tab's one WebSocket connection to the server, which is
 * the sole authority over RoomState (see server/src/signaling/RoomStore.ts).
 * Every action here is just "send a request, wait for the next room-state
 * broadcast" — there's no local state ownership or peer-to-peer connection
 * to manage.
 */
export class ConnectionManager {
  readonly myPeerId: string;
  private roomId = "";
  private signaling: SignalingClient;
  private state: RoomState | null = null;
  private stateListeners = new Set<(state: RoomState) => void>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private disposed = false;

  constructor(opts: { signalingUrl: string; peerId: string; name: string }) {
    this.myPeerId = opts.peerId;
    this.signaling = new SignalingClient(opts.signalingUrl);
    this.signaling.onMessage((msg) => this.handleMessage(msg));
    this.signaling.onOpen(() => this.emitStatus(this.state ? "connected" : "connecting"));
    this.signaling.onClose(() => this.emitStatus("reconnecting"));
  }

  // ---- Subscriptions ----

  onStateChange(cb: (state: RoomState) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  getState(): RoomState | null {
    return this.state;
  }

  private emitState(): void {
    if (this.state) for (const cb of this.stateListeners) cb(this.state);
  }

  private emitStatus(status: ConnectionStatus): void {
    for (const cb of this.statusListeners) cb(status);
  }

  // ---- Connecting ----

  /** Idempotent: creates the room (if `createWithDeck` is given and it doesn't exist yet) or (re)joins it — see RoomStore.connect for the exact semantics. Safe to call again, e.g. after a reload, with the same peerId. */
  connect(roomId: string, name: string, createWithDeck?: DeckConfig): void {
    this.roomId = roomId;
    this.emitStatus("connecting");
    this.signaling.send({ type: "connect-room", roomId, peerId: this.myPeerId, name, createWithDeck });
  }

  private handleMessage(msg: ServerToClientMessage): void {
    switch (msg.type) {
      case "room-state":
        this.state = msg.state;
        this.emitStatus("connected");
        this.emitState();
        break;
      case "room-not-found":
        this.emitStatus("room-not-found");
        break;
      case "kicked":
        clearRoomIdentity(this.roomId); // otherwise a reload would silently resume the removed seat
        this.emitStatus("kicked");
        this.dispose(); // terminal — don't attempt to reconnect
        break;
      case "error":
        break;
    }
  }

  // ---- Actions (vote, round control, roles) ----

  private dispatch(action: RoomAction): void {
    this.signaling.send({ type: "room-action", roomId: this.roomId, action });
  }

  castVote(value: string | null): void {
    this.dispatch({ type: "vote-cast", peerId: this.myPeerId, value });
  }

  rename(name: string): void {
    this.dispatch({ type: "rename", peerId: this.myPeerId, name });
  }

  setSpectator(isSpectator: boolean): void {
    this.dispatch({ type: "set-spectator", peerId: this.myPeerId, isSpectator });
  }

  reveal(): void {
    this.dispatch({ type: "request-reveal", peerId: this.myPeerId });
  }

  /** "Vote again": re-votes the current task from scratch. */
  reset(): void {
    this.dispatch({ type: "request-reset", peerId: this.myPeerId });
  }

  /** Clears votes and advances to the next task in the list. */
  nextTask(): void {
    this.dispatch({ type: "request-next-task", peerId: this.myPeerId });
  }

  setDeck(deck: DeckConfig): void {
    this.dispatch({ type: "request-set-deck", peerId: this.myPeerId, deck });
  }

  setAutoReveal(enabled: boolean): void {
    this.dispatch({ type: "request-set-auto-reveal", peerId: this.myPeerId, enabled });
  }

  addTask(title: string, description: string): void {
    const task: TaskInfo = { id: generateTaskId(), title, description };
    this.dispatch({ type: "request-add-task", peerId: this.myPeerId, task });
  }

  editTask(taskId: string, title: string, description: string): void {
    this.dispatch({ type: "request-edit-task", peerId: this.myPeerId, taskId, title, description });
  }

  removeTask(taskId: string): void {
    this.dispatch({ type: "request-remove-task", peerId: this.myPeerId, taskId });
  }

  moveTask(taskId: string, direction: "up" | "down"): void {
    this.dispatch({ type: "request-move-task", peerId: this.myPeerId, taskId, direction });
  }

  setCurrentTask(taskId: string): void {
    this.dispatch({ type: "request-set-current-task", peerId: this.myPeerId, taskId });
  }

  grantAdmin(targetPeerId: string): void {
    this.dispatch({ type: "request-grant-admin", peerId: this.myPeerId, targetPeerId });
  }

  revokeAdmin(targetPeerId: string): void {
    this.dispatch({ type: "request-revoke-admin", peerId: this.myPeerId, targetPeerId });
  }

  transferHost(targetPeerId: string): void {
    this.dispatch({ type: "request-transfer-host", peerId: this.myPeerId, targetPeerId });
  }

  kickParticipant(targetPeerId: string): void {
    this.dispatch({ type: "request-kick", peerId: this.myPeerId, targetPeerId });
  }

  // ---- Teardown ----

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.signaling.close();
  }
}
