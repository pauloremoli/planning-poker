import { describe, expect, it } from "vitest";
import type { Participant, RoomState } from "./dataChannelTypes.js";
import { DEFAULT_DECK } from "./dataChannelTypes.js";
import { addParticipant, applyAction, everyoneVoted, removeParticipant } from "./roomReducer.js";

function participant(overrides: Partial<Participant> & Pick<Participant, "peerId" | "role" | "joinIndex">): Participant {
  return { name: overrides.peerId, vote: null, connected: true, isSpectator: false, ...overrides };
}

function makeState(overrides?: Partial<RoomState>): RoomState {
  return {
    roomId: "room1",
    hostPeerId: "host1",
    deck: DEFAULT_DECK,
    revealed: false,
    round: 0,
    participants: [
      participant({ peerId: "host1", name: "Host", role: "host", joinIndex: 0 }),
      participant({ peerId: "admin1", name: "Admin", role: "admin", joinIndex: 1 }),
      participant({ peerId: "member1", name: "Member", role: "member", joinIndex: 2 }),
    ],
    tasks: [],
    currentTaskId: null,
    taskResults: {},
    autoRevealEnabled: false,
    ...overrides,
  };
}

describe("addParticipant", () => {
  it("adds a new member with the next joinIndex", () => {
    const state = makeState();
    const next = addParticipant(state, "new1", "Newbie");
    const added = next.participants.find((p) => p.peerId === "new1");
    expect(added).toEqual({ peerId: "new1", name: "Newbie", joinIndex: 3, role: "member", vote: null, connected: true, isSpectator: false });
  });

  it("assigns joinIndex 0 to the first participant in an empty room", () => {
    const state = makeState({ participants: [] });
    const next = addParticipant(state, "p1", "First");
    expect(next.participants[0].joinIndex).toBe(0);
  });
});

describe("applyAction: vote-cast", () => {
  it("records a member's vote", () => {
    const state = makeState();
    const next = applyAction(state, { type: "vote-cast", peerId: "member1", value: "5" });
    expect(next.participants.find((p) => p.peerId === "member1")?.vote).toBe("5");
  });

  it("is a no-op once the round is revealed", () => {
    const state = makeState({ revealed: true });
    const next = applyAction(state, { type: "vote-cast", peerId: "member1", value: "5" });
    expect(next).toBe(state);
  });

  it("is a no-op for a spectator", () => {
    const state = makeState({
      participants: [participant({ peerId: "s1", role: "member", joinIndex: 0, isSpectator: true })],
    });
    const next = applyAction(state, { type: "vote-cast", peerId: "s1", value: "5" });
    expect(next).toBe(state);
  });

  it("is a no-op for an unknown sender", () => {
    const state = makeState();
    const next = applyAction(state, { type: "vote-cast", peerId: "ghost", value: "5" });
    expect(next).toBe(state);
  });
});

describe("applyAction: rename", () => {
  it("updates the sender's name", () => {
    const state = makeState();
    const next = applyAction(state, { type: "rename", peerId: "member1", name: "New Name" });
    expect(next.participants.find((p) => p.peerId === "member1")?.name).toBe("New Name");
  });

  it("is a no-op for an unknown sender", () => {
    const state = makeState();
    const next = applyAction(state, { type: "rename", peerId: "ghost", name: "X" });
    expect(next).toBe(state);
  });
});

describe("applyAction: set-spectator", () => {
  it("becoming a spectator clears any in-progress vote", () => {
    const state = makeState({
      participants: [participant({ peerId: "member1", role: "member", joinIndex: 0, vote: "8" })],
    });
    const next = applyAction(state, { type: "set-spectator", peerId: "member1", isSpectator: true });
    const p = next.participants[0];
    expect(p.isSpectator).toBe(true);
    expect(p.vote).toBeNull();
  });

  it("leaving spectator mode preserves the (null) vote", () => {
    const state = makeState({
      participants: [participant({ peerId: "member1", role: "member", joinIndex: 0, isSpectator: true })],
    });
    const next = applyAction(state, { type: "set-spectator", peerId: "member1", isSpectator: false });
    expect(next.participants[0].isSpectator).toBe(false);
  });
});

describe("applyAction: request-reveal", () => {
  it("is rejected for a plain member", () => {
    const state = makeState();
    const next = applyAction(state, { type: "request-reveal", peerId: "member1" });
    expect(next).toBe(state);
  });

  it("allows admin and host", () => {
    const state = makeState();
    expect(applyAction(state, { type: "request-reveal", peerId: "admin1" }).revealed).toBe(true);
    expect(applyAction(state, { type: "request-reveal", peerId: "host1" }).revealed).toBe(true);
  });

  it("just flips revealed when there's no current task", () => {
    const state = makeState();
    const next = applyAction(state, { type: "request-reveal", peerId: "host1" });
    expect(next.revealed).toBe(true);
    expect(next.taskResults).toEqual({});
  });

  it("computes the average for the current task, treating ½ as 0.5 and excluding non-numeric votes", () => {
    const state = makeState({
      currentTaskId: "t1",
      tasks: [{ id: "t1", title: "Task", description: "" }],
      participants: [
        participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "100" }),
        participant({ peerId: "admin1", role: "admin", joinIndex: 1, vote: "½" }),
        participant({ peerId: "member1", role: "member", joinIndex: 2, vote: "?" }),
      ],
    });
    const next = applyAction(state, { type: "request-reveal", peerId: "host1" });
    expect(next.taskResults["t1"].average).toBeCloseTo(50.25);
    expect(next.taskResults["t1"].votes).toHaveLength(3);
  });

  it("average is null when no numeric votes were cast", () => {
    const state = makeState({
      currentTaskId: "t1",
      tasks: [{ id: "t1", title: "Task", description: "" }],
      participants: [participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "?" })],
    });
    const next = applyAction(state, { type: "request-reveal", peerId: "host1" });
    expect(next.taskResults["t1"].average).toBeNull();
  });
});

describe("applyAction: request-reset", () => {
  it("clears votes, flips revealed off, and bumps round", () => {
    const state = makeState({
      revealed: true,
      round: 2,
      participants: [participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "5" })],
    });
    const next = applyAction(state, { type: "request-reset", peerId: "host1" });
    expect(next.revealed).toBe(false);
    expect(next.round).toBe(3);
    expect(next.participants[0].vote).toBeNull();
  });

  it("is rejected for a plain member", () => {
    const state = makeState();
    const next = applyAction(state, { type: "request-reset", peerId: "member1" });
    expect(next).toBe(state);
  });
});

describe("applyAction: request-next-task", () => {
  const tasks = [
    { id: "t1", title: "One", description: "" },
    { id: "t2", title: "Two", description: "" },
  ];

  it("advances to the first task when none is current", () => {
    const state = makeState({ tasks, currentTaskId: null });
    const next = applyAction(state, { type: "request-next-task", peerId: "host1" });
    expect(next.currentTaskId).toBe("t1");
  });

  it("advances to the next task and clears votes", () => {
    const state = makeState({
      tasks,
      currentTaskId: "t1",
      participants: [participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "5" })],
    });
    const next = applyAction(state, { type: "request-next-task", peerId: "host1" });
    expect(next.currentTaskId).toBe("t2");
    expect(next.participants[0].vote).toBeNull();
  });

  it("stays on the last task but still clears votes (round bump)", () => {
    const state = makeState({ tasks, currentTaskId: "t2", round: 0 });
    const next = applyAction(state, { type: "request-next-task", peerId: "host1" });
    expect(next.currentTaskId).toBe("t2");
    expect(next.round).toBe(1);
  });
});

describe("applyAction: request-set-deck / request-set-auto-reveal", () => {
  it("set-deck is permission checked and updates the deck", () => {
    const state = makeState();
    const customDeck = { id: "custom", label: "Custom", values: ["1", "2"] };
    expect(applyAction(state, { type: "request-set-deck", peerId: "member1", deck: customDeck })).toBe(state);
    expect(applyAction(state, { type: "request-set-deck", peerId: "host1", deck: customDeck }).deck).toBe(customDeck);
  });

  it("set-auto-reveal is permission checked and updates the flag", () => {
    const state = makeState();
    expect(applyAction(state, { type: "request-set-auto-reveal", peerId: "member1", enabled: true })).toBe(state);
    expect(applyAction(state, { type: "request-set-auto-reveal", peerId: "admin1", enabled: true }).autoRevealEnabled).toBe(true);
  });
});

describe("applyAction: task management", () => {
  it("adding the first task makes it current", () => {
    const state = makeState();
    const next = applyAction(state, { type: "request-add-task", peerId: "host1", task: { id: "t1", title: "One", description: "" } });
    expect(next.currentTaskId).toBe("t1");
    expect(next.tasks).toHaveLength(1);
  });

  it("adding a task with a duplicate id is a no-op", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "One", description: "" }], currentTaskId: "t1" });
    const next = applyAction(state, { type: "request-add-task", peerId: "host1", task: { id: "t1", title: "Dup", description: "" } });
    expect(next).toBe(state);
  });

  it("is rejected for a plain member", () => {
    const state = makeState();
    const next = applyAction(state, { type: "request-add-task", peerId: "member1", task: { id: "t1", title: "One", description: "" } });
    expect(next).toBe(state);
  });

  it("edit-task updates the title and description of an existing task", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "Old title", description: "Old desc" }] });
    const next = applyAction(state, { type: "request-edit-task", peerId: "host1", taskId: "t1", title: "New title", description: "New desc" });
    expect(next.tasks).toEqual([{ id: "t1", title: "New title", description: "New desc" }]);
  });

  it("edit-task does not touch other tasks or currentTaskId", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
      currentTaskId: "t2",
    });
    const next = applyAction(state, { type: "request-edit-task", peerId: "host1", taskId: "t1", title: "Edited", description: "" });
    expect(next.tasks[1]).toEqual({ id: "t2", title: "Two", description: "" });
    expect(next.currentTaskId).toBe("t2");
  });

  it("edit-task is a no-op for an unknown task id", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "One", description: "" }] });
    const next = applyAction(state, { type: "request-edit-task", peerId: "host1", taskId: "ghost", title: "X", description: "" });
    expect(next).toBe(state);
  });

  it("edit-task is rejected for a plain member", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "One", description: "" }] });
    const next = applyAction(state, { type: "request-edit-task", peerId: "member1", taskId: "t1", title: "Hacked", description: "" });
    expect(next).toBe(state);
  });

  it("removing the current task falls back to the next task", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
      currentTaskId: "t1",
    });
    const next = applyAction(state, { type: "request-remove-task", peerId: "host1", taskId: "t1" });
    expect(next.currentTaskId).toBe("t2");
    expect(next.tasks).toHaveLength(1);
  });

  it("removing the last remaining current task falls back to the previous task", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
      currentTaskId: "t2",
    });
    const next = applyAction(state, { type: "request-remove-task", peerId: "host1", taskId: "t2" });
    expect(next.currentTaskId).toBe("t1");
  });

  it("removing the only task sets currentTaskId to null", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "One", description: "" }], currentTaskId: "t1" });
    const next = applyAction(state, { type: "request-remove-task", peerId: "host1", taskId: "t1" });
    expect(next.currentTaskId).toBeNull();
    expect(next.tasks).toHaveLength(0);
  });

  it("set-current-task clears votes and is a no-op for an unknown id or the already-current id", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
      currentTaskId: "t1",
      participants: [participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "5" })],
    });
    expect(applyAction(state, { type: "request-set-current-task", peerId: "host1", taskId: "unknown" })).toBe(state);
    expect(applyAction(state, { type: "request-set-current-task", peerId: "host1", taskId: "t1" })).toBe(state);

    const next = applyAction(state, { type: "request-set-current-task", peerId: "host1", taskId: "t2" });
    expect(next.currentTaskId).toBe("t2");
    expect(next.participants[0].vote).toBeNull();
  });

  it("move-task swaps a task with its neighbor", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
        { id: "t3", title: "Three", description: "" },
      ],
    });

    const movedUp = applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "t2", direction: "up" });
    expect(movedUp.tasks.map((t) => t.id)).toEqual(["t2", "t1", "t3"]);

    const movedDown = applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "t2", direction: "down" });
    expect(movedDown.tasks.map((t) => t.id)).toEqual(["t1", "t3", "t2"]);
  });

  it("move-task is a no-op at the boundary (first task up, last task down)", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
    });
    expect(applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "t1", direction: "up" })).toBe(state);
    expect(applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "t2", direction: "down" })).toBe(state);
  });

  it("move-task is a no-op for an unknown task id", () => {
    const state = makeState({ tasks: [{ id: "t1", title: "One", description: "" }] });
    expect(applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "ghost", direction: "up" })).toBe(state);
  });

  it("move-task does not touch currentTaskId or votes", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
      currentTaskId: "t1",
      participants: [participant({ peerId: "host1", role: "host", joinIndex: 0, vote: "5" })],
    });
    const next = applyAction(state, { type: "request-move-task", peerId: "host1", taskId: "t2", direction: "up" });
    expect(next.currentTaskId).toBe("t1");
    expect(next.participants[0].vote).toBe("5");
  });

  it("move-task is rejected for a plain member", () => {
    const state = makeState({
      tasks: [
        { id: "t1", title: "One", description: "" },
        { id: "t2", title: "Two", description: "" },
      ],
    });
    const next = applyAction(state, { type: "request-move-task", peerId: "member1", taskId: "t2", direction: "up" });
    expect(next).toBe(state);
  });
});

describe("applyAction: roles", () => {
  it("grant-admin/revoke-admin require host permission", () => {
    const state = makeState();
    expect(applyAction(state, { type: "request-grant-admin", peerId: "admin1", targetPeerId: "member1" })).toBe(state);
    const granted = applyAction(state, { type: "request-grant-admin", peerId: "host1", targetPeerId: "member1" });
    expect(granted.participants.find((p) => p.peerId === "member1")?.role).toBe("admin");

    const revoked = applyAction(granted, { type: "request-revoke-admin", peerId: "host1", targetPeerId: "member1" });
    expect(revoked.participants.find((p) => p.peerId === "member1")?.role).toBe("member");
  });

  it("transfer-host requires host permission and a connected target", () => {
    const state = makeState();
    expect(applyAction(state, { type: "request-transfer-host", peerId: "admin1", targetPeerId: "member1" })).toBe(state);

    const disconnected = makeState({
      participants: state.participants.map((p) => (p.peerId === "admin1" ? { ...p, connected: false } : p)),
    });
    expect(applyAction(disconnected, { type: "request-transfer-host", peerId: "host1", targetPeerId: "admin1" })).toBe(disconnected);

    const next = applyAction(state, { type: "request-transfer-host", peerId: "host1", targetPeerId: "admin1" });
    expect(next.hostPeerId).toBe("admin1");
    expect(next.participants.find((p) => p.peerId === "admin1")?.role).toBe("host");
    expect(next.participants.find((p) => p.peerId === "host1")?.role).toBe("admin");
  });

  it("kick requires host permission, can't target self, and removes the target", () => {
    const state = makeState();
    expect(applyAction(state, { type: "request-kick", peerId: "admin1", targetPeerId: "member1" })).toBe(state);
    expect(applyAction(state, { type: "request-kick", peerId: "host1", targetPeerId: "host1" })).toBe(state);

    const next = applyAction(state, { type: "request-kick", peerId: "host1", targetPeerId: "member1" });
    expect(next.participants.some((p) => p.peerId === "member1")).toBe(false);
  });
});

describe("removeParticipant", () => {
  it("removes only the targeted peer", () => {
    const state = makeState();
    const next = removeParticipant(state, "admin1");
    expect(next.participants.map((p) => p.peerId)).toEqual(["host1", "member1"]);
  });
});

describe("everyoneVoted", () => {
  it("is false with no active participants", () => {
    expect(everyoneVoted(makeState({ participants: [] }))).toBe(false);
  });

  it("is false while any active participant hasn't voted", () => {
    const state = makeState({
      participants: [
        participant({ peerId: "a", role: "member", joinIndex: 0, vote: "5" }),
        participant({ peerId: "b", role: "member", joinIndex: 1, vote: null }),
      ],
    });
    expect(everyoneVoted(state)).toBe(false);
  });

  it("ignores spectators", () => {
    const state = makeState({
      participants: [
        participant({ peerId: "a", role: "member", joinIndex: 0, vote: "5" }),
        participant({ peerId: "b", role: "member", joinIndex: 1, vote: null, isSpectator: true }),
      ],
    });
    expect(everyoneVoted(state)).toBe(true);
  });

  it("is true once every active participant has voted", () => {
    const state = makeState({
      participants: [
        participant({ peerId: "a", role: "member", joinIndex: 0, vote: "5" }),
        participant({ peerId: "b", role: "member", joinIndex: 1, vote: "8" }),
      ],
    });
    expect(everyoneVoted(state)).toBe(true);
  });
});
