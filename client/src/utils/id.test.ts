import { beforeEach, describe, expect, it } from "vitest";
import { clearRoomIdentity, getOrCreatePeerId } from "./id.js";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("getOrCreatePeerId", () => {
  it("generates and persists a peerId for a room", () => {
    const id = getOrCreatePeerId("room1");
    expect(id).toBeTruthy();
    expect(window.sessionStorage.getItem("planning-poker:peer:room1")).toBe(JSON.stringify(id));
  });

  it("returns the same peerId on a later call for the same room (simulating a reload)", () => {
    const first = getOrCreatePeerId("room1");
    const second = getOrCreatePeerId("room1");
    expect(second).toBe(first);
  });

  it("generates distinct peerIds for different rooms", () => {
    const a = getOrCreatePeerId("room1");
    const b = getOrCreatePeerId("room2");
    expect(a).not.toBe(b);
  });
});

describe("clearRoomIdentity", () => {
  it("removes the persisted peerId and join-name for that room", () => {
    getOrCreatePeerId("room1");
    window.sessionStorage.setItem("planning-poker:join-name:room1", JSON.stringify("Alice"));

    clearRoomIdentity("room1");

    expect(window.sessionStorage.getItem("planning-poker:peer:room1")).toBeNull();
    expect(window.sessionStorage.getItem("planning-poker:join-name:room1")).toBeNull();
  });

  it("a subsequent getOrCreatePeerId call generates a fresh id instead of reusing the cleared one", () => {
    const before = getOrCreatePeerId("room1");
    clearRoomIdentity("room1");
    const after = getOrCreatePeerId("room1");
    expect(after).not.toBe(before);
  });

  it("does not affect other rooms' identity", () => {
    const other = getOrCreatePeerId("room2");
    getOrCreatePeerId("room1");
    clearRoomIdentity("room1");
    expect(getOrCreatePeerId("room2")).toBe(other);
  });
});
