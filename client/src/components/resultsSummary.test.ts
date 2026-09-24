import { describe, expect, it } from "vitest";
import type { Participant } from "@planning-poker/shared";
import { buildResultsSummary } from "./resultsSummary.js";

const FIB_DECK = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"];
const TSHIRT_DECK = ["XS", "S", "M", "L", "XL", "XXL", "?"];

function participant(overrides: Partial<Participant> & Pick<Participant, "peerId" | "name" | "vote">): Participant {
  return { joinIndex: 0, role: "member", connected: true, isSpectator: false, ...overrides };
}

function row(summary: ReturnType<typeof buildResultsSummary>, value: string) {
  return summary.distribution.find((r) => r.value === value);
}

describe("buildResultsSummary", () => {
  it("returns an empty round when nobody voted", () => {
    const summary = buildResultsSummary([participant({ peerId: "a", name: "Alice", vote: null })], FIB_DECK);
    expect(summary.totalVotes).toBe(0);
    expect(summary.average).toBeNull();
    expect(summary.distribution).toEqual([]);
  });

  it("computes the average over numeric votes only", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "3" }),
        participant({ peerId: "b", name: "Bob", vote: "?" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(summary.average).toBeCloseTo(5.5);
  });

  it("groups voters' names under their value with a percentage of total votes", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "3" }),
        participant({ peerId: "b", name: "Bob", vote: "3" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "3")).toMatchObject({ count: 2, percent: 67, names: ["Alice", "Bob"] });
    expect(row(summary, "8")).toMatchObject({ count: 1, percent: 33, names: ["Carol"] });
  });

  it("sorts the distribution by the deck's own card order, not by vote count", () => {
    const summary = buildResultsSummary(
      [
        // "8" has more votes than "3", but should still sort after it.
        participant({ peerId: "a", name: "Alice", vote: "8" }),
        participant({ peerId: "b", name: "Bob", vote: "8" }),
        participant({ peerId: "c", name: "Carol", vote: "3" }),
      ],
      FIB_DECK
    );
    expect(summary.distribution.map((r) => r.value)).toEqual(["3", "8"]);
  });

  it("sorts by the deck's own card order, not alphabetically", () => {
    // Alphabetically this would be L, M, S, XL, XS, XXL — meaningless for a size scale.
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "L" }),
        participant({ peerId: "b", name: "Bob", vote: "S" }),
        participant({ peerId: "c", name: "Carol", vote: "XXL" }),
        participant({ peerId: "d", name: "Dave", vote: "XS" }),
      ],
      TSHIRT_DECK
    );
    expect(summary.distribution.map((r) => r.value)).toEqual(["XS", "S", "L", "XXL"]);
  });

  it("tags the lowest and highest numeric rows", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "1" }),
        participant({ peerId: "b", name: "Bob", vote: "8" }),
        participant({ peerId: "c", name: "Carol", vote: "5" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "1")?.tags).toEqual(["lowest"]);
    expect(row(summary, "8")?.tags).toEqual(["highest"]);
    expect(row(summary, "5")?.tags).toEqual([]);
  });

  it("tags lowest/highest on a non-numeric deck (T-shirt sizes) by the deck's own order", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "S" }),
        participant({ peerId: "b", name: "Bob", vote: "XL" }),
        participant({ peerId: "c", name: "Carol", vote: "M" }),
      ],
      TSHIRT_DECK
    );
    expect(row(summary, "S")?.tags).toEqual(["lowest"]);
    expect(row(summary, "XL")?.tags).toEqual(["highest"]);
    expect(row(summary, "M")?.tags).toEqual([]);
    // No numeric average makes sense for T-shirt sizes.
    expect(summary.average).toBeNull();
  });

  it("T-shirt sizes: question-mark is never tagged lowest/highest, and doesn't break the spread check", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "XS" }),
        participant({ peerId: "b", name: "Bob", vote: "?" }),
        participant({ peerId: "c", name: "Carol", vote: "XXL" }),
      ],
      TSHIRT_DECK
    );
    expect(row(summary, "?")?.tags).toEqual([]);
    expect(row(summary, "XS")?.tags).toEqual(["lowest"]);
    expect(row(summary, "XXL")?.tags).toEqual(["highest"]);
    // Untagged, but "?" voters are always worth naming.
    expect(row(summary, "?")?.showNames).toBe(true);
  });

  it("T-shirt sizes: no lowest/highest when everyone agrees (no spread)", () => {
    const summary = buildResultsSummary(
      [participant({ peerId: "a", name: "Alice", vote: "M" }), participant({ peerId: "b", name: "Bob", vote: "M" })],
      TSHIRT_DECK
    );
    expect(row(summary, "M")?.tags).toEqual(["majority"]);
  });

  it("tags majority only when more than one person agrees", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "3" }),
        participant({ peerId: "b", name: "Bob", vote: "3" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "3")?.tags).toContain("majority");
    expect(row(summary, "8")?.tags).not.toContain("majority");
  });

  it("has no majority tag when every vote is unique", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "1" }),
        participant({ peerId: "b", name: "Bob", vote: "2" }),
        participant({ peerId: "c", name: "Carol", vote: "3" }),
      ],
      FIB_DECK
    );
    expect(summary.distribution.some((r) => r.tags.includes("majority"))).toBe(false);
  });

  it("leaves lowest/highest untagged when every numeric vote agrees (no spread)", () => {
    const summary = buildResultsSummary(
      [participant({ peerId: "a", name: "Alice", vote: "5" }), participant({ peerId: "b", name: "Bob", vote: "5" })],
      FIB_DECK
    );
    expect(row(summary, "5")?.tags).toEqual(["majority"]);
  });

  it("can tag question-mark as majority when most people are unsure", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "?" }),
        participant({ peerId: "b", name: "Bob", vote: "?" }),
        participant({ peerId: "c", name: "Carol", vote: "5" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "?")).toMatchObject({ names: ["Alice", "Bob"], tags: ["majority"] });
    expect(row(summary, "5")?.tags).toEqual([]);
  });

  it("never tags a non-numeric row lowest/highest", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "?" }),
        participant({ peerId: "b", name: "Bob", vote: "1" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "?")?.tags).toEqual([]);
    expect(row(summary, "?")?.showNames).toBe(true);
  });

  it("treats ½ as 0.5 for lowest/highest, consistent with the average", () => {
    const summary = buildResultsSummary(
      [participant({ peerId: "a", name: "Alice", vote: "½" }), participant({ peerId: "b", name: "Bob", vote: "3" })],
      FIB_DECK
    );
    expect(row(summary, "½")?.tags).toEqual(["lowest"]);
    expect(row(summary, "3")?.tags).toEqual(["highest"]);
  });

  it("a row can carry both an extreme tag and majority", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "1" }),
        participant({ peerId: "b", name: "Bob", vote: "1" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "1")?.tags.sort()).toEqual(["lowest", "majority"]);
  });
});

describe("showNames", () => {
  it("is false for an untagged row", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "1" }),
        participant({ peerId: "b", name: "Bob", vote: "5" }),
        participant({ peerId: "c", name: "Carol", vote: "8" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "5")?.showNames).toBe(false);
  });

  it("is true for a tagged row", () => {
    const summary = buildResultsSummary(
      [participant({ peerId: "a", name: "Alice", vote: "1" }), participant({ peerId: "b", name: "Bob", vote: "8" })],
      FIB_DECK
    );
    expect(row(summary, "1")?.showNames).toBe(true);
    expect(row(summary, "8")?.showNames).toBe(true);
  });

  it("is always true for question-mark, even with no tag of its own", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "5" }),
        participant({ peerId: "b", name: "Bob", vote: "5" }),
        participant({ peerId: "c", name: "Carol", vote: "?" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "?")?.tags).toEqual([]);
    expect(row(summary, "?")?.showNames).toBe(true);
  });

  it("is always true for the coffee-break card, even with no tag of its own", () => {
    const summary = buildResultsSummary(
      [
        participant({ peerId: "a", name: "Alice", vote: "5" }),
        participant({ peerId: "b", name: "Bob", vote: "5" }),
        participant({ peerId: "c", name: "Carol", vote: "☕" }),
      ],
      FIB_DECK
    );
    expect(row(summary, "☕")?.tags).toEqual([]);
    expect(row(summary, "☕")?.showNames).toBe(true);
  });
});
