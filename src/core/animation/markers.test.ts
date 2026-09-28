import { describe, expect, it } from "vitest";
import {
  addMarker,
  deleteMarker,
  maximumMarkerFrame,
  moveMarker,
  renameMarker,
  type AnimationMarker,
} from "./markers";

describe("animation markers", () => {
  it("inserts and moves markers in frame order and cleans up deletion", () => {
    let markers: AnimationMarker[] = [];
    markers = addMarker(markers, { id: "throw", frame: 16, name: "THROW" }, 22);
    markers = addMarker(markers, { id: "start", frame: 0, name: "START" }, 22);
    expect(markers.map(({ id }) => id)).toEqual(["start", "throw"]);
    markers = moveMarker(markers, "throw", 8, 22);
    expect(markers.map(({ frame }) => frame)).toEqual([0, 8]);
    expect(maximumMarkerFrame(markers)).toBe(8);
    expect(deleteMarker(markers, "start")).toEqual([
      { id: "throw", frame: 8, name: "THROW" },
    ]);
  });

  it("normalizes marker names and preserves marker value", () => {
    const markers = addMarker(
      [],
      { id: "impact", frame: 16, name: "  THROW  ", value: "rock" },
      22,
    );
    expect(renameMarker(markers, "impact", "  RELEASE ")).toEqual([
      { id: "impact", frame: 16, name: "RELEASE", value: "rock" },
    ]);
  });

  it("rejects invalid ids, names, duplicate ids, and frames", () => {
    const marker = { id: "throw", frame: 16, name: "THROW" };
    expect(() => addMarker([], { ...marker, id: " " }, 22)).toThrow(RangeError);
    expect(() => addMarker([], { ...marker, name: "  " }, 22)).toThrow(RangeError);
    expect(() => addMarker([], { ...marker, name: "x".repeat(65) }, 22)).toThrow(
      RangeError,
    );
    expect(() => addMarker([marker], marker, 22)).toThrow(RangeError);
    expect(() => addMarker([], { ...marker, frame: 23 }, 22)).toThrow(RangeError);
    expect(() => addMarker([], marker, Number.NaN)).toThrow(RangeError);
    expect(() => moveMarker([marker], "throw", 1.5, 22)).toThrow(RangeError);
    expect(() => renameMarker([marker], "missing", "GO")).toThrow(RangeError);
  });
});
