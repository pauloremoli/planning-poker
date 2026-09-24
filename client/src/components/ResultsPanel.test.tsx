import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Participant, RoomState } from "@planning-poker/shared";
import { DEFAULT_DECK } from "@planning-poker/shared";
import { createMockRoom } from "../test/mockRoom.js";

const useRoomMock = vi.fn();
vi.mock("../context/RoomContext", () => ({
  useRoom: () => useRoomMock(),
}));

const { default: ResultsPanel } = await import("./ResultsPanel.js");

function participant(overrides: Partial<Participant> & Pick<Participant, "peerId" | "name" | "vote">): Participant {
  return { joinIndex: 0, role: "member", connected: true, isSpectator: false, ...overrides };
}

function makeState(overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomId: "room1",
    hostPeerId: "host1",
    deck: DEFAULT_DECK,
    revealed: true,
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

describe("ResultsPanel", () => {
  it("renders nothing before the round is revealed", () => {
    useRoomMock.mockReturnValue(createMockRoom({ state: makeState({ revealed: false }) }));
    const { container } = render(<ResultsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no state at all", () => {
    useRoomMock.mockReturnValue(createMockRoom({ state: null }));
    const { container } = render(<ResultsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'Nobody voted this round.' when revealed with no votes", () => {
    useRoomMock.mockReturnValue(createMockRoom({ state: makeState({ participants: [participant({ peerId: "a", name: "Alice", vote: null })] }) }));
    render(<ResultsPanel />);
    expect(screen.getByText("Nobody voted this round.")).toBeInTheDocument();
  });

  it("shows the average prominently", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          participants: [participant({ peerId: "a", name: "Alice", vote: "3" }), participant({ peerId: "b", name: "Bob", vote: "8" })],
        }),
      })
    );
    render(<ResultsPanel />);
    expect(screen.getByText("5.5")).toBeInTheDocument();
    expect(screen.getByText("average")).toBeInTheDocument();
  });

  it("tags the lowest, highest, and majority rows with the right names", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          participants: [
            participant({ peerId: "a", name: "Alice", vote: "1" }),
            participant({ peerId: "b", name: "Bob", vote: "1" }),
            participant({ peerId: "c", name: "Carol", vote: "8" }),
          ],
        }),
      })
    );
    render(<ResultsPanel />);
    expect(screen.getByText("Lowest")).toBeInTheDocument();
    expect(screen.getByText("Majority")).toBeInTheDocument();
    expect(screen.getByText("Highest")).toBeInTheDocument();
    expect(screen.getByText("Alice, Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("does not show names for an untagged row, but always shows them for '?'", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          participants: [
            participant({ peerId: "a", name: "Alice", vote: "1" }),
            participant({ peerId: "b", name: "Bob", vote: "5" }),
            participant({ peerId: "c", name: "Carol", vote: "8" }),
            participant({ peerId: "d", name: "Dave", vote: "?" }),
          ],
        }),
      })
    );
    render(<ResultsPanel />);
    // "5" is untagged (no spread-extreme, no majority) — Bob's name shouldn't appear.
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    // "?" always shows its voter, tagged or not.
    expect(screen.getByText("Dave")).toBeInTheDocument();
  });

  it("shows percent and vote count per row", () => {
    useRoomMock.mockReturnValue(
      createMockRoom({
        state: makeState({
          participants: [participant({ peerId: "a", name: "Alice", vote: "5" }), participant({ peerId: "b", name: "Bob", vote: "5" })],
        }),
      })
    );
    render(<ResultsPanel />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("(2 votes)")).toBeInTheDocument();
  });
});
