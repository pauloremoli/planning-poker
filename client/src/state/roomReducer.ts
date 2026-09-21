import type { DataChannelMessage, Participant, RoomState, TaskResult } from "@planning-poker/shared";
import { hasPermission } from "@planning-poker/shared";

/**
 * Applied only by whoever currently holds the host role, against its
 * authoritative RoomState, for every inbound app-level DataChannel message
 * (including ones the host "sends to itself" for its own UI actions, so
 * there's exactly one permission-checking code path — see ConnectionManager).
 * Returns the same `state` reference when a message is a no-op or rejected,
 * so callers can cheaply check `next === prev` to skip a broadcast.
 */
export function applyHostMessage(state: RoomState, message: DataChannelMessage): RoomState {
  const sender = state.participants.find((p) => p.peerId === senderIdOf(message));

  switch (message.type) {
    case "hello": {
      if (state.participants.some((p) => p.peerId === message.peerId)) return state;
      const nextJoinIndex = state.participants.length === 0 ? 0 : Math.max(...state.participants.map((p) => p.joinIndex)) + 1;
      const participant: Participant = {
        peerId: message.peerId,
        name: message.name,
        joinIndex: nextJoinIndex,
        role: "member",
        vote: null,
        connected: true,
        away: false,
      };
      return { ...state, participants: [...state.participants, participant] };
    }

    case "vote-cast": {
      if (!sender || state.revealed || sender.away) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === message.peerId ? { ...p, vote: message.value } : p)),
      };
    }

    case "rename": {
      if (!sender) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === message.peerId ? { ...p, name: message.name } : p)),
      };
    }

    case "set-away": {
      if (!sender) return state;
      return {
        ...state,
        // Stepping away also clears any in-progress vote — an absent
        // participant shouldn't silently count toward the round.
        participants: state.participants.map((p) => (p.peerId === message.peerId ? { ...p, away: message.away, vote: message.away ? null : p.vote } : p)),
      };
    }

    case "request-reveal": {
      if (!sender || !hasPermission(sender.role, "reveal")) return state;
      if (!state.currentTaskId) return { ...state, revealed: true };
      const votes = state.participants.filter((p) => p.vote !== null).map((p) => ({ name: p.name, value: p.vote! }));
      const numeric = votes.map((v) => Number(v.value)).filter((n) => !Number.isNaN(n));
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
      return { ...state, deck: message.deck };
    }

    case "request-set-auto-reveal": {
      if (!sender || !hasPermission(sender.role, "auto-reveal")) return state;
      return { ...state, autoRevealEnabled: message.enabled };
    }

    case "request-add-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      if (state.tasks.some((t) => t.id === message.task.id)) return state;
      return {
        ...state,
        tasks: [...state.tasks, message.task],
        currentTaskId: state.currentTaskId ?? message.task.id,
      };
    }

    case "request-remove-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      const removedIndex = state.tasks.findIndex((t) => t.id === message.taskId);
      if (removedIndex === -1) return state;
      const tasks = state.tasks.filter((t) => t.id !== message.taskId);
      let currentTaskId = state.currentTaskId;
      if (message.taskId === state.currentTaskId) {
        currentTaskId = tasks[removedIndex]?.id ?? tasks[removedIndex - 1]?.id ?? null;
      }
      return { ...state, tasks, currentTaskId };
    }

    case "request-set-current-task": {
      if (!sender || !hasPermission(sender.role, "manage-tasks")) return state;
      if (!state.tasks.some((t) => t.id === message.taskId)) return state;
      if (message.taskId === state.currentTaskId) return state;
      return clearVotes({ ...state, currentTaskId: message.taskId });
    }

    case "request-grant-admin": {
      if (!sender || !hasPermission(sender.role, "grant-admin")) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === message.targetPeerId ? { ...p, role: "admin" } : p)),
      };
    }

    case "request-revoke-admin": {
      if (!sender || !hasPermission(sender.role, "revoke-admin")) return state;
      return {
        ...state,
        participants: state.participants.map((p) => (p.peerId === message.targetPeerId ? { ...p, role: "member" } : p)),
      };
    }

    case "request-transfer-host": {
      if (!sender || !hasPermission(sender.role, "transfer-host")) return state;
      const target = state.participants.find((p) => p.peerId === message.targetPeerId);
      if (!target || !target.connected) return state;
      return {
        ...state,
        hostPeerId: message.targetPeerId,
        participants: state.participants.map((p) => {
          if (p.peerId === message.targetPeerId) return { ...p, role: "host" };
          if (p.peerId === message.peerId) return { ...p, role: "admin" }; // outgoing host keeps admin powers
          return p;
        }),
      };
    }

    case "full-state-sync":
    case "ping":
    case "pong":
      return state;
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

function senderIdOf(message: DataChannelMessage): string | undefined {
  switch (message.type) {
    case "hello":
    case "vote-cast":
    case "rename":
    case "set-away":
    case "request-reveal":
    case "request-reset":
    case "request-next-task":
    case "request-set-deck":
    case "request-set-auto-reveal":
    case "request-add-task":
    case "request-remove-task":
    case "request-set-current-task":
    case "request-grant-admin":
    case "request-revoke-admin":
    case "request-transfer-host":
      return message.peerId;
    default:
      return undefined;
  }
}

export function removeParticipant(state: RoomState, peerId: string): RoomState {
  return { ...state, participants: state.participants.filter((p) => p.peerId !== peerId) };
}

/** Whether every active (non-away) participant currently has a vote in — the trigger condition for auto-reveal. */
export function everyoneVoted(state: RoomState): boolean {
  const active = state.participants.filter((p) => !p.away);
  return active.length > 0 && active.every((p) => p.vote !== null);
}
