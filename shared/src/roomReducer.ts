import type { Participant, RoomAction, RoomState, TaskResult } from "./dataChannelTypes.js";
import { hasPermission } from "./dataChannelTypes.js";
import { parseVoteValue } from "./deck.js";

/** Adds a brand-new participant (not a reconnect — callers check for an existing peerId first). */
export function addParticipant(state: RoomState, peerId: string, name: string): RoomState {
  const nextJoinIndex = state.participants.length === 0 ? 0 : Math.max(...state.participants.map((p) => p.joinIndex)) + 1;
  const participant: Participant = {
    peerId,
    name,
    joinIndex: nextJoinIndex,
    role: "member",
    vote: null,
    connected: true,
    isSpectator: false,
  };
  return { ...state, participants: [...state.participants, participant] };
}

/**
 * Applies one participant-initiated action against the room's authoritative
 * state. Returns the same `state` reference when an action is a no-op or
 * rejected, so callers can cheaply check `next === prev` to skip a broadcast.
 */
export function applyAction(state: RoomState, action: RoomAction): RoomState {
  const sender = state.participants.find((p) => p.peerId === action.peerId);

  switch (action.type) {
    case "vote-cast": {
      if (!sender || state.revealed || sender.isSpectator) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === action.peerId ? { ...p, vote: action.value } : p)),
      };
    }

    case "rename": {
      if (!sender) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === action.peerId ? { ...p, name: action.name } : p)),
      };
    }

    case "set-spectator": {
      if (!sender) return state;
      return {
        ...state,
        // Becoming a spectator also clears any in-progress vote — a
        // non-voting participant shouldn't silently count toward the round.
        participants: state.participants.map((p) =>
          p.peerId === action.peerId ? { ...p, isSpectator: action.isSpectator, vote: action.isSpectator ? null : p.vote } : p
        ),
      };
    }

    case "request-reveal": {
      if (!sender || !hasPermission(sender.role, "reveal")) return state;
      if (!state.currentTaskId) return { ...state, revealed: true };
      const votes = state.participants.filter((p) => p.vote !== null).map((p) => ({ name: p.name, value: p.vote! }));
      const numeric = votes.map((v) => parseVoteValue(v.value)).filter((n): n is number => n !== null);
      const result: TaskResult = { votes, average: numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null };
      return { ...state, revealed: true, taskResults: { ...state.taskResults, [state.currentTaskId]: result } };
    }

    case "request-reset": {
      if (!sender || !hasPermission(sender.role, "reset")) return state;
      return clearVotes(state);
    }

    case "request-next-task": {
      if (!sender || !hasPermission(sender.role, "reset")) return state;
      const currentIndex = state.tasks.findIndex((t) => t.id === state.currentTaskId);
      const nextIndex = currentIndex === -1 ? (state.tasks.length > 0 ? 0 : -1) : Math.min(currentIndex + 1, state.tasks.length - 1);
      return clearVotes({ ...state, currentTaskId: nextIndex === -1 ? null : state.tasks[nextIndex].id });
    }

    case "request-set-deck": {
      if (!sender || !hasPermission(sender.role, "set-deck")) return state;
      return { ...state, deck: action.deck };
    }

    case "request-set-auto-reveal": {
      if (!sender || !hasPermission(sender.role, "auto-reveal")) return state;
      return { ...state, autoRevealEnabled: action.enabled };
    }

    case "request-add-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      if (state.tasks.some((t) => t.id === action.task.id)) return state;
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        currentTaskId: state.currentTaskId ?? action.task.id,
      };
    }

    case "request-edit-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, title: action.title, description: action.description } : t)),
      };
    }

    case "request-remove-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      const removedIndex = state.tasks.findIndex((t) => t.id === action.taskId);
      if (removedIndex === -1) return state;
      const tasks = state.tasks.filter((t) => t.id !== action.taskId);
      let currentTaskId = state.currentTaskId;
      if (action.taskId === state.currentTaskId) {
        currentTaskId = tasks[removedIndex]?.id ?? tasks[removedIndex - 1]?.id ?? null;
      }
      return { ...state, tasks, currentTaskId };
    }

    case "request-move-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      const index = state.tasks.findIndex((t) => t.id === action.taskId);
      if (index === -1) return state;
      const swapWith = action.direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= state.tasks.length) return state;
      const tasks = [...state.tasks];
      [tasks[index], tasks[swapWith]] = [tasks[swapWith], tasks[index]];
      return { ...state, tasks };
    }

    case "request-set-current-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      if (action.taskId === state.currentTaskId) return state;
      return clearVotes({ ...state, currentTaskId: action.taskId });
    }

    case "request-grant-admin": {
      if (!sender || !hasPermission(sender.role, "grant-admin")) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === action.targetPeerId ? { ...p, role: "admin" } : p)),
      };
    }

    case "request-revoke-admin": {
      if (!sender || !hasPermission(sender.role, "revoke-admin")) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === action.targetPeerId ? { ...p, role: "member" } : p)),
      };
    }

    case "request-transfer-host": {
      if (!sender || !hasPermission(sender.role, "transfer-host")) return state;
      const target = state.participants.find((p) => p.peerId === action.targetPeerId);
      if (!target || !target.connected) return state;
      return {
        ...state,
        hostPeerId: action.targetPeerId,
        participants: state.participants.map((p) => {
          if (p.peerId === action.targetPeerId) return { ...p, role: "host" };
          if (p.peerId === action.peerId) return { ...p, role: "admin" }; // outgoing host keeps admin powers
          return p;
        }),
      };
    }

    case "request-kick": {
      if (!sender || !hasPermission(sender.role, "kick")) return state;
      if (action.targetPeerId === action.peerId) return state; // can't kick yourself
      if (!state.participants.some((p) => p.peerId === action.targetPeerId)) return state;
      return removeParticipant(state, action.targetPeerId);
    }
  }
}

function clearVotes(state: RoomState): RoomState {
  return {
    ...state,
    revealed: false,
    round: state.round + 1,
    participants: state.participants.map((p) => ({ ...p, vote: null })),
  };
}

export function removeParticipant(state: RoomState, peerId: string): RoomState {
  return { ...state, participants: state.participants.filter((p) => p.peerId !== peerId) };
}

/** Whether every active (non-spectator) participant currently has a vote in — the trigger condition for auto-reveal. */
export function everyoneVoted(state: RoomState): boolean {
  const active = state.participants.filter((p) => !p.isSpectator);
  return active.length > 0 && active.every((p) => p.vote !== null);
}
