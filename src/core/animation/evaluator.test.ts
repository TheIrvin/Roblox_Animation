import { describe, expect, it } from "vitest";
import { quaternionFromEulerXYZ } from "../math/quaternion";
import { createBindPose } from "../rigs/pose";
import { R15_RIG } from "../rigs/r15";
import { upsertKeyframe, type AnimationTracks, type JointTrack } from "./keyframes";
import { evaluateAnimationFrame } from "./evaluator";

describe("animation evaluator", () => {
  it("returns exact keyframe transforms and holds values outside the track", () => {
    let track = undefined;
    track = upsertKeyframe(
      track,
      "RightUpperArm",
      4,
      {
        position: [1, 2, 3],
        rotation: quaternionFromEulerXYZ([0, 0, 0]),
      },
      10,
      { style: "Linear", direction: "Out" },
    );
    track = upsertKeyframe(
      track,
      "RightUpperArm",
      8,
      {
        position: [5, 6, 7],
        rotation: quaternionFromEulerXYZ([0, Math.PI / 2, 0]),
      },
      10,
      { style: "Linear", direction: "Out" },
    );
    const tracks: AnimationTracks = { RightUpperArm: track };
    const pose = createBindPose(R15_RIG);

    expect(evaluateAnimationFrame(tracks, pose, 4).RightUpperArm).toEqual(
      track.keyframes[0].transform,
    );
    expect(evaluateAnimationFrame(tracks, pose, 0).RightUpperArm).toEqual(
      track.keyframes[0].transform,
    );
    expect(evaluateAnimationFrame(tracks, pose, 10).RightUpperArm).toEqual(
      track.keyframes[1].transform,
    );
  });

  it("interpolates multiple sparse joint tracks independently", () => {
    let armTrack = undefined;
    armTrack = upsertKeyframe(
      armTrack,
      "RightUpperArm",
      0,
      {
        position: [0, 0, 0],
        rotation: quaternionFromEulerXYZ([0, 0, 0]),
      },
      20,
      { style: "Linear", direction: "Out" },
    );
    armTrack = upsertKeyframe(
      armTrack,
      "RightUpperArm",
      10,
      {
        position: [10, 0, 0],
        rotation: quaternionFromEulerXYZ([0, 0, Math.PI / 2]),
      },
      20,
      { style: "Linear", direction: "Out" },
    );
    let headTrack = undefined;
    headTrack = upsertKeyframe(
      headTrack,
      "Head",
      0,
      {
        position: [0, 1, 0],
        rotation: quaternionFromEulerXYZ([0, 0, 0]),
      },
      20,
      { style: "Linear", direction: "Out" },
    );
    headTrack = upsertKeyframe(
      headTrack,
      "Head",
      20,
      {
        position: [0, 3, 0],
        rotation: quaternionFromEulerXYZ([0, Math.PI, 0]),
      },
      20,
      { style: "Linear", direction: "Out" },
    );
    const pose = evaluateAnimationFrame(
      { RightUpperArm: armTrack, Head: headTrack },
      createBindPose(R15_RIG),
      5,
    );

    expect(pose.RightUpperArm.position).toEqual([5, 0, 0]);
    expect(pose.RightUpperArm.rotation[2]).toBeCloseTo(Math.sin(Math.PI / 8), 5);
    expect(pose.Head.position).toEqual([0, 1.5, 0]);
    expect(pose.Head.rotation[1]).toBeCloseTo(Math.sin(Math.PI / 8), 5);
    expect(pose.LeftHand).toEqual(createBindPose(R15_RIG).LeftHand);
  });

  it("uses outgoing easing and rejects invalid frame positions", () => {
    let track = undefined;
    track = upsertKeyframe(
      track,
      "RightHand",
      0,
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
      },
      10,
      { style: "Cubic", direction: "In" },
    );
    track = upsertKeyframe(
      track,
      "RightHand",
      10,
      {
        position: [8, 0, 0],
        rotation: [0, 0, 0, 1],
      },
      10,
      { style: "Linear", direction: "Out" },
    );
    const pose = createBindPose(R15_RIG);
    expect(
      evaluateAnimationFrame({ RightHand: track }, pose, 5).RightHand.position,
    ).toEqual([1, 0, 0]);
    expect(() => evaluateAnimationFrame({}, pose, -1)).toThrow(RangeError);
    expect(() => evaluateAnimationFrame({}, pose, Number.NaN)).toThrow(RangeError);
  });

  it("evaluates the preliminary R15 ThrowRock tracks at playback cadence", () => {
    const definitions = [
      { jointId: "UpperTorso", angles: [0, 0.15, 0.55, 0] },
      { jointId: "RightUpperArm", angles: [0, -0.45, 1.35, 0] },
      { jointId: "RightLowerArm", angles: [0, 1.1, 0.25, 0] },
    ] as const;
    const frames = [0, 8, 16, 22];
    const tracks = Object.fromEntries(
      definitions.map(({ jointId, angles }) => {
        let track: JointTrack | undefined;
        frames.forEach((frame, index) => {
          track = upsertKeyframe(
            track,
            jointId,
            frame,
            {
              position: [0, 0, 0],
              rotation: quaternionFromEulerXYZ([angles[index], 0, 0]),
            },
            22,
            { style: "Cubic", direction: "Out" },
          );
        });
        return [jointId, track];
      }),
    ) as AnimationTracks;
    const basePose = createBindPose(R15_RIG);
    let previous = evaluateAnimationFrame(tracks, basePose, 0);
    for (let frame = 0.5; frame <= 22; frame += 0.5) {
      const pose = evaluateAnimationFrame(tracks, basePose, frame);
      for (const jointId of Object.keys(tracks)) {
        const rotation = pose[jointId].rotation;
        expect(Math.hypot(...rotation)).toBeCloseTo(1, 5);
        expect(rotation.every(Number.isFinite)).toBe(true);
      }
      expect(pose.RightUpperArm.rotation).not.toEqual(previous.RightUpperArm.rotation);
      previous = pose;
    }
    expect(evaluateAnimationFrame(tracks, basePose, 16).RightUpperArm).toEqual(
      tracks.RightUpperArm.keyframes[2].transform,
    );
  });
});
