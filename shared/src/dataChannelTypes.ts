// Types for messages exchanged peer-to-peer over WebRTC DataChannels.
// The signaling server never sees any of this — it only relays the WebRTC
// handshake (see signalingTypes.ts). This is the actual application protocol.

export type ParticipantRole = "host" | "admin" | "member";

export interface Participant {
  peerId: string;
  name: string;
  /** Monotonically increasing, assigned by whoever was host at join time. Doubles as the deterministic host-migration order. */
  joinIndex: number;
  role: ParticipantRole;
  vote: string | null;
  connected: boolean;
  /** Self-service "stepped away" status — doesn't affect permissions, just how the participant is displayed/sorted and whether they can vote. */
  away: boolean;
}

export interface DeckConfig {
  id: string;
  label: string;
  values: string[];
}

export const PRESET_DECKS: DeckConfig[] = [
  { id: "fibonacci", label: "Fibonacci", values: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"] },
  { id: "modified-fibonacci", label: "Modified Fibonacci", values: ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"] },
  { id: "tshirt", label: "T-Shirt Sizes", values: ["XS", "S", "M", "L", "XL", "XXL", "?"] },
  { id: "powers-of-two", label: "Powers of Two", values: ["0", "1", "2", "4", "8", "16", "32", "64", "?", "☕"] },
];

export const DEFAULT_DECK: DeckConfig = PRESET_DECKS[0];

export interface TaskInfo {
  id: string;
  title: string;
  description: string;
}

export interface TaskResult {
  votes: { name: string; value: string }[];
  average: number | null;
}

export interface RoomState {
  roomId: string;
  hostPeerId: string;
  deck: DeckConfig;
  revealed: boolean;
  round: number;
  participants: Participant[];
  tasks: TaskInfo[];
  /** null when the task list is empty. Tracked by id (not array index) so removals/reorders can't desync it. */
  currentTaskId: string | null;
  /** Snapshotted each time a task's votes are revealed (overwritten on a later re-vote+reveal of the same task) — the source for the end-of-session summary. */
  taskResults: Record<string, TaskResult>;
  /** When on, the host auto-reveals 5s after every active (non-away) participant has voted. */
  autoRevealEnabled: boolean;
}

export const AUTO_REVEAL_DELAY_MS = 5000;

/** Whether a graceful handoff (host chose to transfer) vs. an emergency migration (host disconnected). */
export type HostChangeReason = "graceful-transfer" | "migration" | "initial";

export type DataChannelMessage =
  | { type: "hello"; peerId: string; name: string }
  | { type: "full-state-sync"; state: RoomState; reason: HostChangeReason }
  | { type: "vote-cast"; peerId: string; value: string | null }
  | { type: "rename"; peerId: string; name: string }
  | { type: "set-away"; peerId: string; away: boolean }
  | { type: "request-reveal"; peerId: string }
  /** "Vote again": clears votes for the current task without changing which task is active. */
  | { type: "request-reset"; peerId: string }
  /** Clears votes and advances to the next task in the list (a no-op advance, but still clears votes, if already on the last task). */
  | { type: "request-next-task"; peerId: string }
  | { type: "request-set-deck"; peerId: string; deck: DeckConfig }
  | { type: "request-set-auto-reveal"; peerId: string; enabled: boolean }
  | { type: "request-add-task"; peerId: string; task: TaskInfo }
  | { type: "request-remove-task"; peerId: string; taskId: string }
  | { type: "request-set-current-task"; peerId: string; taskId: string }
  | { type: "request-grant-admin"; peerId: string; targetPeerId: string }
  | { type: "request-revoke-admin"; peerId: string; targetPeerId: string }
  | { type: "request-transfer-host"; peerId: string; targetPeerId: string }
  | { type: "ping"; ts: number }
  | { type: "pong"; ts: number };

export function hasPermission(role: ParticipantRole, action: "reveal" | "reset" | "set-deck" | "manage-tasks" | "auto-reveal" | "grant-admin" | "revoke-admin" | "transfer-host"): boolean {
  switch (action) {
    case "reveal":
    case "reset":
    case "set-deck":
    case "manage-tasks":
    case "auto-reveal":
      return role === "host" || role === "admin";
    case "grant-admin":
    case "revoke-admin":
    case "transfer-host":
      return role === "host";
    default:
      return false;
  }
}
