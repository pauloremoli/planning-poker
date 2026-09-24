import { describe, expect, it } from "vitest";
import { splitLinks } from "./linkify.js";

describe("splitLinks", () => {
  it("returns a single text segment when there are no links", () => {
    expect(splitLinks("just plain text")).toEqual([{ type: "text", value: "just plain text" }]);
  });

  it("returns nothing for an empty string", () => {
    expect(splitLinks("")).toEqual([]);
  });

  it("linkifies a URL surrounded by text", () => {
    expect(splitLinks("see https://example.com for details")).toEqual([
      { type: "text", value: "see " },
      { type: "link", value: "https://example.com" },
      { type: "text", value: " for details" },
    ]);
  });

  it("linkifies a bare URL with nothing else", () => {
    expect(splitLinks("https://example.com")).toEqual([{ type: "link", value: "https://example.com" }]);
  });

  it("supports plain http, not just https", () => {
    expect(splitLinks("http://example.com")).toEqual([{ type: "link", value: "http://example.com" }]);
  });

  it("linkifies multiple URLs", () => {
    expect(splitLinks("https://a.com and https://b.com")).toEqual([
      { type: "link", value: "https://a.com" },
      { type: "text", value: " and " },
      { type: "link", value: "https://b.com" },
    ]);
  });

  it("trims a trailing sentence period out of the link", () => {
    expect(splitLinks("See https://example.com/path.")).toEqual([
      { type: "text", value: "See " },
      { type: "link", value: "https://example.com/path" },
      { type: "text", value: "." },
    ]);
  });

  it("trims a trailing closing parenthesis out of the link", () => {
    expect(splitLinks("(https://example.com/path)")).toEqual([
      { type: "text", value: "(" },
      { type: "link", value: "https://example.com/path" },
      { type: "text", value: ")" },
    ]);
  });

  it("keeps a query string and path intact", () => {
    const url = "https://example.com/search?q=foo&bar=1";
    expect(splitLinks(`go to ${url} now`)).toEqual([
      { type: "text", value: "go to " },
      { type: "link", value: url },
      { type: "text", value: " now" },
    ]);
  });

  it("does not linkify text that merely mentions a domain without a scheme", () => {
    expect(splitLinks("visit example.com")).toEqual([{ type: "text", value: "visit example.com" }]);
  });
});
