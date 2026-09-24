import { beforeEach, describe, expect, it } from "vitest";
import { readSessionStorage, readStorage, writeSessionStorage, writeStorage } from "./storage.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("localStorage helpers", () => {
  it("round-trips a value", () => {
    writeStorage("name", "Alex");
    expect(readStorage<string>("name")).toBe("Alex");
  });

  it("returns null for a missing key", () => {
    expect(readStorage<string>("missing")).toBeNull();
  });

  it("namespaces keys so they don't collide with unrelated site storage", () => {
    writeStorage("name", "Alex");
    expect(window.localStorage.getItem("name")).toBeNull();
    expect(window.localStorage.getItem("planning-poker:name")).toBe(JSON.stringify("Alex"));
  });

  it("returns null instead of throwing on corrupt stored JSON", () => {
    window.localStorage.setItem("planning-poker:bad", "{not json");
    expect(readStorage("bad")).toBeNull();
  });
});

describe("sessionStorage helpers", () => {
  it("round-trips a value independently of localStorage", () => {
    writeSessionStorage("peerId:room1", "abc123");
    expect(readSessionStorage<string>("peerId:room1")).toBe("abc123");
    expect(readStorage<string>("peerId:room1")).toBeNull();
  });
});
