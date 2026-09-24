import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoomState } from "@planning-poker/shared";
import { DEFAULT_DECK } from "@planning-poker/shared";
import { createMockRoom } from "../test/mockRoom.js";

const useRoomMock = vi.fn();
vi.mock("../context/RoomContext", () => ({
  useRoom: () => useRoomMock(),
}));

// Imported after the mock is registered, per vitest's hoisting model.
const { default: TaskPanel } = await import("./TaskPanel.js");

function makeState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomId: "room1",
    hostPeerId: "host1",
    deck: DEFAULT_DECK,
    revealed: false,
    round: 0,
    participants: [],
    tasks: [],
    currentTaskId: null,
    taskResults: {},
    autoRevealEnabled: true,
    ...overrides,
  };
}

afterEach(() => {
  useRoomMock.mockReset();
});

describe("TaskPanel: member view (canControlRound: false)", () => {
  it("renders nothing when there is no current task", () => {
    useRoomMock.mockReturnValue(createMockRoom({ state: makeState(), canControlRound: false }));
    const { container } = render(<TaskPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows only the current task's title and description, no list or controls", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          tasks: [
            { id: "t1", title: "Add search filter", description: "Users need to filter by date." },
            { id: "t2", title: "Other task", description: "" },
          ],
          currentTaskId: "t1",
        }),
        canControlRound: false,
      })
    );
    render(<TaskPanel />);
    expect(screen.getByText("Voting for task:")).toBeInTheDocument();
    expect(screen.getByText("Add search filter")).toBeInTheDocument();
    expect(screen.getByText("Users need to filter by date.")).toBeInTheDocument();
    expect(screen.queryByText("Other task")).not.toBeInTheDocument();
    expect(screen.queryByText("+ Add task")).not.toBeInTheDocument();
  });

  it("shows the task's average when a result exists", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          tasks: [{ id: "t1", title: "Task", description: "" }],
          currentTaskId: "t1",
          taskResults: { t1: { votes: [], average: 5.5 } },
        }),
        canControlRound: false,
      })
    );
    render(<TaskPanel />);
    expect(screen.getByText("avg 5.5")).toBeInTheDocument();
  });

  it("linkifies a URL in the description", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          tasks: [{ id: "t1", title: "Task", description: "see https://example.com for spec" }],
          currentTaskId: "t1",
        }),
        canControlRound: false,
      })
    );
    render(<TaskPanel />);
    const link = screen.getByRole("link", { name: "https://example.com" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });
});

describe("TaskPanel: admin/host view (canControlRound: true)", () => {
  it("shows 'No tasks added yet.' and an Add task button when empty", () => {
    useRoomMock.mockReturnValue(createMockRoom({ state: makeState(), canControlRound: true }));
    render(<TaskPanel />);
    expect(screen.getByText("No tasks added yet.")).toBeInTheDocument();
    expect(screen.getByText("+ Add task")).toBeInTheDocument();
  });

  it("submits a new task via addTask, trimmed", () => {
    const room = createMockRoom({ state: makeState(), canControlRound: true });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);

    fireEvent.click(screen.getByText("+ Add task"));
    fireEvent.change(screen.getByPlaceholderText("Task title, e.g. PROJ-123 Add search filter"), { target: { value: "  New task  " } });
    fireEvent.change(screen.getByPlaceholderText("Description (optional)"), { target: { value: "  details  " } });
    fireEvent.click(screen.getByText("Add"));

    expect(room.addTask).toHaveBeenCalledWith("New task", "details");
  });

  it("does not submit an add with a blank title", () => {
    const room = createMockRoom({ state: makeState(), canControlRound: true });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);

    fireEvent.click(screen.getByText("+ Add task"));
    expect(screen.getByText("Add")).toBeDisabled();
  });

  it("lists every task, numbered, with move/edit/remove controls", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          tasks: [
            { id: "t1", title: "First", description: "" },
            { id: "t2", title: "Second", description: "" },
          ],
          currentTaskId: "t1",
        }),
        canControlRound: true,
      })
    );
    render(<TaskPanel />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    // First task is current, up/first-position — up disabled, down enabled.
    expect(screen.getByLabelText("Move First up")).toBeDisabled();
    expect(screen.getByLabelText("Move First down")).not.toBeDisabled();
    // Second task is last — down disabled, up enabled.
    expect(screen.getByLabelText("Move Second up")).not.toBeDisabled();
    expect(screen.getByLabelText("Move Second down")).toBeDisabled();
  });

  it("moveTask is called with the right task and direction", () => {
    const room = createMockRoom({
      state: makeState({
        tasks: [
          { id: "t1", title: "First", description: "" },
          { id: "t2", title: "Second", description: "" },
        ],
      }),
      canControlRound: true,
    });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);
    fireEvent.click(screen.getByLabelText("Move Second up"));
    expect(room.moveTask).toHaveBeenCalledWith("t2", "up");
  });

  it("removeTask is called for the clicked task", () => {
    const room = createMockRoom({
      state: makeState({ tasks: [{ id: "t1", title: "First", description: "" }] }),
      canControlRound: true,
    });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);
    fireEvent.click(screen.getByLabelText("Remove First"));
    expect(room.removeTask).toHaveBeenCalledWith("t1");
  });

  it("setCurrentTask is called when switching to a non-current task, but the current task's own button is disabled", () => {
    const room = createMockRoom({
      state: makeState({
        tasks: [
          { id: "t1", title: "First", description: "" },
          { id: "t2", title: "Second", description: "" },
        ],
        currentTaskId: "t1",
      }),
      canControlRound: true,
    });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);

    const switchButtons = screen.getAllByTitle("Switch to this task");
    expect(switchButtons[0]).toBeDisabled(); // "First" is already current
    fireEvent.click(switchButtons[1]); // "Second"
    expect(room.setCurrentTask).toHaveBeenCalledWith("t2");
  });

  it("editing a task pre-fills the form and saves via editTask", () => {
    const room = createMockRoom({
      state: makeState({ tasks: [{ id: "t1", title: "Old title", description: "Old desc" }] }),
      canControlRound: true,
    });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);

    fireEvent.click(screen.getByLabelText("Edit Old title"));
    const titleInput = screen.getByDisplayValue("Old title");
    const descInput = screen.getByDisplayValue("Old desc");
    fireEvent.change(titleInput, { target: { value: "New title" } });
    fireEvent.change(descInput, { target: { value: "New desc" } });
    fireEvent.click(screen.getByText("Save"));

    expect(room.editTask).toHaveBeenCalledWith("t1", "New title", "New desc");
  });

  it("canceling an edit discards changes without calling editTask", () => {
    const room = createMockRoom({
      state: makeState({ tasks: [{ id: "t1", title: "Old title", description: "" }] }),
      canControlRound: true,
    });
    useRoomMock.mockReturnValue(room);
    render(<TaskPanel />);

    fireEvent.click(screen.getByLabelText("Edit Old title"));
    fireEvent.change(screen.getByDisplayValue("Old title"), { target: { value: "Changed" } });
    fireEvent.click(screen.getByText("Cancel"));

    expect(room.editTask).not.toHaveBeenCalled();
    expect(screen.getByText("Old title")).toBeInTheDocument();
  });
});
