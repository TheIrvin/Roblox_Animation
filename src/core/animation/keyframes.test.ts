import { describe, expect, it } from "vitest";
import { deleteKeyframe, findKeyframe, moveKeyframe, upsertKeyframe } from "./keyframes";

const neutralPose = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0, 1] as [number, number, number, number],
};

describe("sparse joint keyframes", () => {
  it("inserts frames in sorted order", () => {
    const track = upsertKeyframe(undefined, "RightUpperArm", 16, neutralPose, 22);
    const sorted = upsertKeyframe(track, "RightUpperArm", 0, neutralPose, 22);
    expect(sorted.keyframes.map((keyframe) => keyframe.frame)).toEqual([0, 16]);
  });

  it("updates a duplicate frame instead of creating a second entry", () => {
    const first = upsertKeyframe(undefined, "RightUpperArm", 4, neutralPose, 22);
    const updated = upsertKeyframe(
      first,
      "RightUpperArm",
      4,
      { ...neutralPose, position: [1, 2, 3] },
      22,
    );
    expect(updated.keyframes).toHaveLength(1);
    expect(updated.keyframes[0].transform.position).toEqual([1, 2, 3]);
  });

  it("moves a keyframe without colliding with an existing frame", () => {
    const first = upsertKeyframe(undefined, "RightUpperArm", 2, neutralPose, 22);
    const track = upsertKeyframe(first, "RightUpperArm", 8, neutralPose, 22);
    const moved = moveKeyframe({ RightUpperArm: track }, "RightUpperArm", 2, 6, 22);
    expect(moved.RightUpperArm.keyframes.map((keyframe) => keyframe.frame)).toEqual([
      6, 8,
    ]);
    expect(() => moveKeyframe(moved, "RightUpperArm", 6, 8, 22)).toThrow(
      /already exists/,
    );
  });

  it("enforces the duration boundary on insertion and movement", () => {
    expect(() => upsertKeyframe(undefined, "Head", 23, neutralPose, 22)).toThrow(
      /outside/,
    );
    const track = upsertKeyframe(undefined, "Head", 22, neutralPose, 22);
    expect(() => moveKeyframe({ Head: track }, "Head", 22, 23, 22)).toThrow(/outside/);
  });

  it("deletes a keyframe and removes an empty track", () => {
    const track = upsertKeyframe(undefined, "Head", 0, neutralPose, 22);
    expect(findKeyframe({ Head: track }, "Head", 0)).toBeDefined();
    expect(deleteKeyframe({ Head: track }, "Head", 0)).toEqual({});
  });
});
