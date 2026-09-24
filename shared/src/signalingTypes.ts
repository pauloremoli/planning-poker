// The single WebSocket protocol between a browser tab and the server. The
// server holds each room's authoritative RoomState in memory and broadcasts
// it to every connected participant on every change — there is no
// peer-to-peer layer, so this is the entire application protocol.

import type { DeckConfig, RoomAction, RoomState } from "./dataChannelTypes.js";

export type ClientToServerMessage =
  /**
   * Idempotent connect/reconnect. If the room doesn't exist yet, `createWithDeck`
   * creates it with this peer as host; omitted, an unknown room replies
   * room-not-found. If the room exists and `peerId` is already a participant,
   * this is a reconnect (same identity, role, vote — just marks them connected
   * again) rather than adding a duplicate.
   */
  | { type: "connect-room"; roomId: string; peerId: string; name: string; createWithDeck?: DeckConfig }
  /** Wraps a RoomAction with the roomId it applies to — kept off RoomAction itself so the same action shape is also what roomReducer.ts's pure applyAction consumes. */
  | { type: "room-action"; roomId: string; action: RoomAction };

export type ServerToClientMessage =
  | { type: "room-state"; state: RoomState }
  | { type: "room-not-found" }
  /** Sent right before the server drops a kicked participant's connection, so their client shows a clear reason instead of a generic disconnect. */
  | { type: "kicked" }
  | { type: "error"; message: string };
