// Types for messages exchanged over the WebSocket signaling connection.
// The signaling server is a pure relay: it routes these messages by
// roomId/peerId and never inspects or persists application data (names,
// votes). See dataChannelTypes.ts for the actual app protocol, which flows
// peer-to-peer over WebRTC once a connection is established here.

export type ClientToServerMessage =
  | { type: "create-room"; roomId: string; peerId: string }
  | { type: "join-room"; roomId: string; peerId: string }
  | { type: "offer"; roomId: string; toPeerId: string; fromPeerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; roomId: string; toPeerId: string; fromPeerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; roomId: string; toPeerId: string; fromPeerId: string; candidate: RTCIceCandidateInit }
  | { type: "claim-host"; roomId: string; peerId: string }
  /** Sent by the current host right before a deliberate (graceful) handoff, freeing the host slot so the chosen successor's claim-host succeeds. */
  | { type: "release-host"; roomId: string; peerId: string }
  | { type: "leave-room"; roomId: string; peerId: string };

export type ServerToClientMessage =
  | { type: "room-created"; roomId: string }
  | { type: "room-joined"; roomId: string; hostPeerId: string }
  | { type: "room-not-found"; roomId: string }
  | { type: "offer"; fromPeerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; fromPeerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; fromPeerId: string; candidate: RTCIceCandidateInit }
  | { type: "host-disconnected"; roomId: string; oldHostPeerId: string }
  | { type: "claim-ack"; accepted: boolean; currentHostPeerId?: string }
  | { type: "host-changed"; roomId: string; newHostPeerId: string }
  | { type: "error"; message: string };
