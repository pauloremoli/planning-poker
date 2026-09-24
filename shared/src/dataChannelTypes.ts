// Core room data model and the actions that mutate it. The server is the
// sole authority over RoomState (see roomReducer.ts) — these types describe
// what a room looks like and what a participant is allowed to ask for.

export type ParticipantRole = "host" | "admin" | "member";

export interface Participant {
  peerId: string;
  name: string;
  /** Monotonically increasing, assigned by the server at join time. */
  joinIndex: number;
  role: ParticipantRole;
  vote: string | null;
  /** False while the server is waiting out the reconnect grace period after this peer's socket closed. */
  connected: boolean;
  /** Self-service spectator status — doesn't affect permissions, just how the participant is displayed/sorted and whether they can vote. */
  isSpectator: boolean;
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
  /** When on, the server auto-reveals 2s after every active (non-spectator) participant has voted. */
  autoRevealEnabled: boolean;
}

export const AUTO_REVEAL_DELAY_MS = 2000;

/** State-mutating requests a client can send about a room it's already connected to (see signalingTypes.ts for connecting/leaving). Applied server-side by roomReducer.ts's applyAction. */
export type RoomAction =
  | { type: "vote-cast"; peerId: string; value: string | null }
  | { type: "rename"; peerId: string; name: string }
  | { type: "set-spectator"; peerId: string; isSpectator: boolean }
  | { type: "request-reveal"; peerId: string }
  /** "Vote again": clears votes for the current task without changing which task is active. */
  | { type: "request-reset"; peerId: string }
  /** Clears votes and advances to the next task in the list (a no-op advance, but still clears votes, if already on the last task). */
  | { type: "request-next-task"; peerId: string }
  | { type: "request-set-deck"; peerId: string; deck: DeckConfig }
  | { type: "request-set-auto-reveal"; peerId: string; enabled: boolean }
  | { type: "request-add-task"; peerId: string; task: TaskInfo }
  | { type: "request-edit-task"; peerId: string; taskId: string; title: string; description: string }
  | { type: "request-remove-task"; peerId: string; taskId: string }
  | { type: "request-move-task"; peerId: string; taskId: string; direction: "up" | "down" }
  | { type: "request-set-current-task"; peerId: string; taskId: string }
  | { type: "request-grant-admin"; peerId: string; targetPeerId: string }
  | { type: "request-revoke-admin"; peerId: string; targetPeerId: string }
  | { type: "request-transfer-host"; peerId: string; targetPeerId: string }
  | { type: "request-kick"; peerId: string; targetPeerId: string };

export function hasPermission(
  role: ParticipantRole,
  action: "reveal" | "reset" | "set-deck" | "manage-tasks" | "auto-reveal" | "grant-admin" | "revoke-admin" | "transfer-host" | "kick"
): boolean {
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
    case "kick":
      return role === "host";
    default:
      return false;
  }
}
