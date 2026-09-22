import type { DataChannelMessage, DeckConfig, HostChangeReason, Participant, RoomState, ServerToClientMessage } from "@planning-poker/shared";
import { AUTO_REVEAL_DELAY_MS } from "@planning-poker/shared";
import { applyHostMessage, everyoneVoted, removeParticipant } from "../state/roomReducer";
import { SignalingClient } from "./SignalingClient";
import { iceConfig } from "./iceConfig";
import { generateTaskId } from "../utils/id";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "host-disconnected"
  | "reconnecting"
  | "room-not-found"
  | "kicked";

interface Link {
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  pendingCandidates: RTCIceCandidateInit[];
  lastPingOrPongAt: number;
  /**
   * Fixed at creation time — "outbound" means we (as a peer) opened this
   * toward a host; "inbound" means we (as host) accepted it from a peer.
   * Deliberately NOT derived from the live `this.role`: role can flip (e.g.
   * mid-promotion) while this same link is still being torn down, and using
   * the live role there previously misclassified our own outbound link's
   * close as an inbound peer disconnecting, wrongly evicting them.
   */
  kind: "outbound" | "inbound";
}

const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 15000;
const DISCONNECT_GRACE_MS = 3000;

/**
 * Owns every WebRTC connection for this browser tab's participation in a
 * room. Deliberately a single class with a role flag (rather than separate
 * Host/Peer classes) so host migration and manual ownership transfer are
 * just a role flip on the same object, reusing the exact same connection
 * and reconnection code paths as a fresh join.
 */
export class ConnectionManager {
  role: "host" | "peer" = "peer";
  readonly myPeerId: string;
  private myName: string;
  private roomId = "";
  private signaling: SignalingClient;
  private links = new Map<string, Link>();
  private state: RoomState | null = null;
  private stateListeners = new Set<(state: RoomState) => void>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private autoRevealTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: { signalingUrl: string; peerId: string; name: string }) {
    this.myPeerId = opts.peerId;
    this.myName = opts.name;
    this.signaling = new SignalingClient(opts.signalingUrl);
    this.signaling.onMessage((msg) => this.handleSignalingMessage(msg));
    this.heartbeatTimer = setInterval(() => this.heartbeatTick(), HEARTBEAT_INTERVAL_MS);
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

  // ---- Room creation / joining ----

  createRoom(roomId: string, deck: DeckConfig): void {
    this.roomId = roomId;
    this.role = "host";
    this.state = {
      roomId,
      hostPeerId: this.myPeerId,
      deck,
      revealed: false,
      round: 0,
      participants: [{ peerId: this.myPeerId, name: this.myName, joinIndex: 0, role: "host", vote: null, connected: true, isSpectator: false }],
      tasks: [],
      currentTaskId: null,
      taskResults: {},
      autoRevealEnabled: false,
    };
    this.signaling.send({ type: "create-room", roomId, peerId: this.myPeerId });
    this.emitStatus("connected");
    this.emitState();
  }

  joinRoom(roomId: string): void {
    this.roomId = roomId;
    this.role = "peer";
    this.emitStatus("connecting");
    this.signaling.send({ type: "join-room", roomId, peerId: this.myPeerId });
  }

  // ---- Actions (vote, round control, roles) ----

  castVote(value: string | null): void {
    this.dispatchAction({ type: "vote-cast", peerId: this.myPeerId, value });
  }

  rename(name: string): void {
    this.myName = name;
    this.dispatchAction({ type: "rename", peerId: this.myPeerId, name });
  }

  setSpectator(isSpectator: boolean): void {
    this.dispatchAction({ type: "set-spectator", peerId: this.myPeerId, isSpectator });
  }

  reveal(): void {
    this.dispatchAction({ type: "request-reveal", peerId: this.myPeerId });
  }

  /** "Vote again": re-votes the current task from scratch. */
  reset(): void {
    this.dispatchAction({ type: "request-reset", peerId: this.myPeerId });
  }

  /** Clears votes and advances to the next task in the list. */
  nextTask(): void {
    this.dispatchAction({ type: "request-next-task", peerId: this.myPeerId });
  }

  setDeck(deck: DeckConfig): void {
    this.dispatchAction({ type: "request-set-deck", peerId: this.myPeerId, deck });
  }

  setAutoReveal(enabled: boolean): void {
    this.dispatchAction({ type: "request-set-auto-reveal", peerId: this.myPeerId, enabled });
  }

  addTask(title: string, description: string): void {
    this.dispatchAction({ type: "request-add-task", peerId: this.myPeerId, task: { id: generateTaskId(), title, description } });
  }

  removeTask(taskId: string): void {
    this.dispatchAction({ type: "request-remove-task", peerId: this.myPeerId, taskId });
  }

  setCurrentTask(taskId: string): void {
    this.dispatchAction({ type: "request-set-current-task", peerId: this.myPeerId, taskId });
  }

  grantAdmin(targetPeerId: string): void {
    this.dispatchAction({ type: "request-grant-admin", peerId: this.myPeerId, targetPeerId });
  }

  revokeAdmin(targetPeerId: string): void {
    this.dispatchAction({ type: "request-revoke-admin", peerId: this.myPeerId, targetPeerId });
  }

  /** Graceful, host-initiated handoff of the hub role — distinct from automatic migration, which only triggers on an unexpected host disconnect. */
  transferHost(targetPeerId: string): void {
    if (this.role !== "host" || !this.state) return;
    const next = applyHostMessage(this.state, { type: "request-transfer-host", peerId: this.myPeerId, targetPeerId });
    if (next === this.state) return;
    this.state = next;
    this.broadcastState("graceful-transfer");
    this.emitState();
    this.signaling.send({ type: "release-host", roomId: this.roomId, peerId: this.myPeerId });
    this.role = "peer";
    this.clearAutoRevealTimer();
    // Force a fresh handshake rather than ensureConnectedToHost's "reuse if
    // already connected" shortcut: our existing link IS the one keyed at
    // targetPeerId (we were its hub a moment ago), but the target is about
    // to tear down its side in promoteToHost() — reusing it would leave us
    // both holding a connection the other side has already discarded.
    this.connectToHost(targetPeerId);
  }

  /** Host-only: forcibly removes a participant. They're told why first (over their still-open link) so their client shows a clear reason instead of a generic disconnect, then — after a brief moment for that message to actually transmit — their connection is torn down; everyone else's view updates immediately. */
  kickParticipant(targetPeerId: string): void {
    if (this.role !== "host" || !this.state) return;
    const next = applyHostMessage(this.state, { type: "request-kick", peerId: this.myPeerId, targetPeerId });
    if (next === this.state) return;

    this.send(targetPeerId, { type: "kicked" });
    this.state = next;
    this.broadcastState("initial");
    this.emitState();

    setTimeout(() => {
      const link = this.links.get(targetPeerId);
      if (link) {
        this.silenceAndClose(link);
        this.links.delete(targetPeerId);
      }
    }, 300);
  }

  private dispatchAction(msg: DataChannelMessage): void {
    if (this.role === "host") {
      this.applyAndBroadcast(msg);
    } else {
      const hostPeerId = this.state?.hostPeerId;
      if (hostPeerId) this.send(hostPeerId, msg);
    }
  }

  private applyAndBroadcast(msg: DataChannelMessage): void {
    if (!this.state) return;
    const next = applyHostMessage(this.state, msg);
    if (next === this.state) return;
    this.state = next;
    this.broadcastState("initial");
    this.emitState();
    this.checkAutoReveal();
  }

  // ---- Auto-reveal ----
  // When enabled, the host reveals automatically once every active
  // (non-spectator) participant has voted, after a short grace delay — long
  // enough that a genuinely stale/rejected timer firing after we've
  // stopped being host, or after the round moved on, is a safe no-op.

  private checkAutoReveal(): void {
    const state = this.state;
    if (this.role !== "host" || !state || !state.autoRevealEnabled || state.revealed || !everyoneVoted(state)) {
      this.clearAutoRevealTimer();
      return;
    }
    if (this.autoRevealTimer) return; // already counting down

    const targetRound = state.round;
    this.autoRevealTimer = setTimeout(() => {
      this.autoRevealTimer = null;
      const current = this.state;
      if (this.role !== "host" || !current || current.round !== targetRound || current.revealed) return;
      if (!current.autoRevealEnabled || !everyoneVoted(current)) return;
      this.applyAndBroadcast({ type: "request-reveal", peerId: this.myPeerId });
    }, AUTO_REVEAL_DELAY_MS);
  }

  private clearAutoRevealTimer(): void {
    if (this.autoRevealTimer) {
      clearTimeout(this.autoRevealTimer);
      this.autoRevealTimer = null;
    }
  }

  // ---- Signaling message dispatch ----

  private handleSignalingMessage(msg: ServerToClientMessage): void {
    switch (msg.type) {
      case "room-joined":
        this.connectToHost(msg.hostPeerId);
        break;
      case "room-not-found":
        this.emitStatus("room-not-found");
        break;
      case "offer":
        void this.acceptOfferAsHost(msg.fromPeerId, msg.sdp);
        break;
      case "answer":
        void this.handleAnswer(msg.fromPeerId, msg.sdp);
        break;
      case "ice-candidate":
        this.handleRemoteIceCandidate(msg.fromPeerId, msg.candidate);
        break;
      case "host-disconnected":
        if (this.role === "peer") this.handleHostLost(msg.oldHostPeerId);
        break;
      case "claim-ack":
        this.handleClaimAck(msg.accepted, msg.currentHostPeerId);
        break;
      case "host-changed":
        if (this.state && msg.newHostPeerId !== this.state.hostPeerId) {
          this.state = { ...this.state, hostPeerId: msg.newHostPeerId };
          this.emitState();
        }
        if (msg.newHostPeerId !== this.myPeerId) {
          this.ensureConnectedToHost(msg.newHostPeerId);
        }
        break;
      case "room-created":
      case "error":
        break;
    }
  }

  private handleClaimAck(accepted: boolean, currentHostPeerId?: string): void {
    if (accepted) {
      this.emitStatus("connected");
      return;
    }
    if (this.state?.hostPeerId === this.myPeerId) {
      // We still believe we should be host (e.g. a graceful release-host
      // hasn't reached the server yet) — retry shortly rather than giving up.
      setTimeout(() => this.signaling.send({ type: "claim-host", roomId: this.roomId, peerId: this.myPeerId }), 300);
      return;
    }
    if (currentHostPeerId) {
      this.role = "peer";
      this.clearAutoRevealTimer();
      this.ensureConnectedToHost(currentHostPeerId);
    }
  }

  // ---- WebRTC connection establishment ----
  // The joiner is always the SDP offerer, the host is always the answerer —
  // this single handshake shape is reused for a fresh join, an emergency
  // migration reconnect, and a graceful ownership-transfer reconnect alike.

  private connectToHost(hostPeerId: string): void {
    this.teardownAllLinks();
    const pc = new RTCPeerConnection(iceConfig);
    const link: Link = { pc, dc: null, pendingCandidates: [], lastPingOrPongAt: Date.now(), kind: "outbound" };
    this.links.set(hostPeerId, link);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.signaling.send({ type: "ice-candidate", roomId: this.roomId, toPeerId: hostPeerId, fromPeerId: this.myPeerId, candidate: e.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        this.scheduleHostLostCheck(hostPeerId);
      }
    };

    const dc = pc.createDataChannel("poker");
    this.wireDataChannel(hostPeerId, dc, link);

    void pc
      .createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        this.signaling.send({ type: "offer", roomId: this.roomId, toPeerId: hostPeerId, fromPeerId: this.myPeerId, sdp: pc.localDescription! });
      });

    this.emitStatus("connecting");
  }

  private async acceptOfferAsHost(fromPeerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.role !== "host") {
      // Receiving an offer implies we're expected to act as host now (the
      // sender already computed us as the next host) — flip and proceed.
      this.role = "host";
    }
    const pc = new RTCPeerConnection(iceConfig);
    const link: Link = { pc, dc: null, pendingCandidates: [], lastPingOrPongAt: Date.now(), kind: "inbound" };
    this.links.set(fromPeerId, link);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.signaling.send({ type: "ice-candidate", roomId: this.roomId, toPeerId: fromPeerId, fromPeerId: this.myPeerId, candidate: e.candidate.toJSON() });
      }
    };
    pc.ondatachannel = (e) => this.wireDataChannel(fromPeerId, e.channel, link);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        this.handlePeerLost(fromPeerId);
      }
    };

    await pc.setRemoteDescription(sdp);
    this.flushPendingCandidates(fromPeerId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.signaling.send({ type: "answer", roomId: this.roomId, toPeerId: fromPeerId, fromPeerId: this.myPeerId, sdp: pc.localDescription! });
  }

  private async handleAnswer(fromPeerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const link = this.links.get(fromPeerId);
    if (!link) return;
    await link.pc.setRemoteDescription(sdp);
    this.flushPendingCandidates(fromPeerId);
  }

  private handleRemoteIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): void {
    const link = this.links.get(fromPeerId);
    if (!link) return;
    if (link.pc.remoteDescription) {
      void link.pc.addIceCandidate(candidate).catch(() => {});
    } else {
      link.pendingCandidates.push(candidate);
    }
  }

  private flushPendingCandidates(peerId: string): void {
    const link = this.links.get(peerId);
    if (!link) return;
    for (const c of link.pendingCandidates.splice(0)) {
      void link.pc.addIceCandidate(c).catch(() => {});
    }
  }

  private wireDataChannel(peerId: string, dc: RTCDataChannel, link: Link): void {
    link.dc = dc;
    dc.onopen = () => {
      link.lastPingOrPongAt = Date.now();
      if (link.kind === "outbound") {
        this.send(peerId, { type: "hello", peerId: this.myPeerId, name: this.myName });
        this.emitStatus("connected");
      }
    };
    dc.onclose = () => {
      // Keyed off the link's fixed creation-time direction, not the live
      // this.role — role can flip (e.g. mid-promotion) while this same
      // link is still being torn down as part of that very transition.
      if (link.kind === "outbound") this.scheduleHostLostCheck(peerId);
      else this.handlePeerLost(peerId);
    };
    dc.onmessage = (e) => {
      let msg: DataChannelMessage;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      this.handleDataChannelMessage(peerId, msg);
    };
  }

  private send(peerId: string, msg: DataChannelMessage): void {
    const dc = this.links.get(peerId)?.dc;
    if (dc?.readyState === "open") dc.send(JSON.stringify(msg));
  }

  private broadcastState(reason: HostChangeReason): void {
    if (!this.state) return;
    const msg: DataChannelMessage = { type: "full-state-sync", state: this.state, reason };
    for (const link of this.links.values()) {
      if (link.dc?.readyState === "open") link.dc.send(JSON.stringify(msg));
    }
  }

  // ---- DataChannel message handling ----

  private handleDataChannelMessage(fromPeerId: string, msg: DataChannelMessage): void {
    const link = this.links.get(fromPeerId);

    if (msg.type === "ping") {
      if (link) link.lastPingOrPongAt = Date.now();
      this.clearHostLostCheck(fromPeerId);
      this.send(fromPeerId, { type: "pong", ts: msg.ts });
      return;
    }
    if (msg.type === "pong") {
      if (link) link.lastPingOrPongAt = Date.now();
      return;
    }

    if (this.role === "host") {
      this.applyAndBroadcast(msg);
      return;
    }

    if (msg.type === "kicked") {
      this.emitStatus("kicked");
      this.dispose(); // terminal — don't attempt to reconnect
      return;
    }

    if (msg.type === "full-state-sync") {
      this.applyIncomingState(msg.state);
    }
  }

  private applyIncomingState(state: RoomState): void {
    const previousHostPeerId = this.state?.hostPeerId;
    this.state = state;
    this.emitState();

    if (state.hostPeerId === this.myPeerId) {
      if (this.role !== "host") this.promoteToHost();
      return;
    }
    if (state.hostPeerId !== previousHostPeerId) {
      this.ensureConnectedToHost(state.hostPeerId);
    }
  }

  private ensureConnectedToHost(targetHostPeerId: string): void {
    const existing = this.links.get(targetHostPeerId);
    if (existing && (existing.pc.connectionState === "connected" || existing.pc.connectionState === "connecting" || existing.pc.connectionState === "new")) {
      return;
    }
    this.emitStatus("reconnecting");
    this.connectToHost(targetHostPeerId);
  }

  // ---- Host migration & promotion ----

  private handleHostLost(oldHostPeerId: string): void {
    if (!this.state || this.state.hostPeerId !== oldHostPeerId) return; // stale/duplicate signal
    this.emitStatus("host-disconnected");

    // Admins take priority over plain members — among connected admins the
    // one with the lowest joinIndex (earliest to join) goes first; members
    // are only considered as a fallback chain once no admin is left.
    const remaining = this.state.participants.filter((p) => p.peerId !== oldHostPeerId);
    const byJoinIndex = (a: Participant, b: Participant) => a.joinIndex - b.joinIndex;
    const candidates = [...remaining.filter((p) => p.role === "admin").sort(byJoinIndex), ...remaining.filter((p) => p.role !== "admin").sort(byJoinIndex)];
    const nextHostPeerId = candidates[0]?.peerId ?? this.myPeerId;

    this.state = removeParticipant(
      {
        ...this.state,
        hostPeerId: nextHostPeerId,
        participants: this.state.participants.map((p) => (p.peerId === nextHostPeerId ? { ...p, role: "host" } : p)),
      },
      oldHostPeerId
    );
    this.emitState();

    if (nextHostPeerId === this.myPeerId) {
      this.promoteToHost();
    } else {
      const rank = Math.max(0, candidates.findIndex((p) => p.peerId === this.myPeerId));
      setTimeout(() => this.ensureConnectedToHost(nextHostPeerId), rank * 300);
    }
  }

  private promoteToHost(): void {
    this.role = "host";
    this.teardownAllLinks();
    this.signaling.send({ type: "claim-host", roomId: this.roomId, peerId: this.myPeerId });
    this.checkAutoReveal(); // the room may already be in an "everyone voted, waiting" state we just inherited
  }

  private scheduleHostLostCheck(hostPeerId: string): void {
    if (this.graceTimers.has(hostPeerId)) return;
    const timer = setTimeout(() => {
      this.graceTimers.delete(hostPeerId);
      const link = this.links.get(hostPeerId);
      if (link?.pc.connectionState === "connected") return; // recovered on its own
      this.handleHostLost(hostPeerId);
    }, DISCONNECT_GRACE_MS);
    this.graceTimers.set(hostPeerId, timer);
  }

  private clearHostLostCheck(peerId: string): void {
    const timer = this.graceTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(peerId);
    }
  }

  private handlePeerLost(peerId: string): void {
    const link = this.links.get(peerId);
    if (link) {
      link.dc?.close();
      link.pc.close();
      this.links.delete(peerId);
    }
    if (!this.state?.participants.some((p) => p.peerId === peerId)) return;
    this.state = removeParticipant(this.state, peerId);
    this.broadcastState("initial");
    this.emitState();
  }

  // ---- Heartbeat ----

  private heartbeatTick(): void {
    const now = Date.now();
    if (this.role === "host") {
      for (const [peerId, link] of [...this.links]) {
        if (link.dc?.readyState === "open") {
          link.dc.send(JSON.stringify({ type: "ping", ts: now } satisfies DataChannelMessage));
        }
        if (now - link.lastPingOrPongAt > HEARTBEAT_TIMEOUT_MS) {
          this.handlePeerLost(peerId);
        }
      }
    } else {
      for (const [hostPeerId, link] of [...this.links]) {
        if (now - link.lastPingOrPongAt > HEARTBEAT_TIMEOUT_MS) {
          this.handleHostLost(hostPeerId);
        }
      }
    }
  }

  // ---- Teardown ----

  /**
   * Closes every link we currently hold, deliberately — used when we're
   * stepping down as host (closing our old inbound peer links) or discarding
   * a stale outbound link right after being promoted. In both cases WE
   * decided to end these connections, so the close is expected, not a
   * remote party disconnecting — silence the handlers first so it doesn't
   * run handlePeerLost/scheduleHostLostCheck and evict participants who
   * are, from every other participant's perspective, still very much here.
   */
  private teardownAllLinks(): void {
    for (const link of this.links.values()) this.silenceAndClose(link);
    this.links.clear();
  }

  /** Silences a single link's handlers before closing it — same reasoning as teardownAllLinks, for a one-off deliberate close (e.g. kicking a participant) rather than a full wipe. */
  private silenceAndClose(link: Link): void {
    if (link.dc) {
      link.dc.onopen = null;
      link.dc.onclose = null;
      link.dc.onmessage = null;
      link.dc.close();
    }
    link.pc.onconnectionstatechange = null;
    link.pc.ondatachannel = null;
    link.pc.onicecandidate = null;
    link.pc.close();
  }

  dispose(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    for (const t of this.graceTimers.values()) clearTimeout(t);
    this.clearAutoRevealTimer();
    this.teardownAllLinks();
    this.signaling.close();
  }
}
