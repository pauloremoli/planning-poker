import { describe, expect, it } from "vitest";
import { parseVoteValue } from "./deck.js";

describe("parseVoteValue", () => {
  it("parses plain numeric cards", () => {
    expect(parseVoteValue("0")).toBe(0);
    expect(parseVoteValue("13")).toBe(13);
    expect(parseVoteValue("100")).toBe(100);
  });

  it("treats ½ as 0.5", () => {
    expect(parseVoteValue("½")).toBe(0.5);
  });

  it("returns null for non-numeric cards", () => {
    expect(parseVoteValue("?")).toBeNull();
    expect(parseVoteValue("☕")).toBeNull();
    expect(parseVoteValue("XL")).toBeNull();
    expect(parseVoteValue("")).toBeNull();
  });
});
