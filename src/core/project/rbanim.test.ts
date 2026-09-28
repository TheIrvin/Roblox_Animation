import { describe, expect, it } from "vitest";
import {
  isPoseRepresentedByTracks,
  parseRbanimProjectV1,
  serializeRbanimProjectV1,
} from "./rbanim";
import { createBindPose } from "../rigs/pose";
import { R15_RIG } from "../rigs/r15";
import { normalizeQuaternion } from "../math/quaternion";

const validProject = {
  schemaVersion: 1,
  app: { name: "Roblox Animator Desktop", createdWith: "0.1.0" },
  project: {
    id: "test-project",
    name: "ThrowRock",
    rig: "R15",
    fps: 30,
    durationFrames: 22,
    loop: false,
    priority: "Action",
  },
  tracks: {
    RightUpperArm: {
      jointId: "RightUpperArm",
      keyframes: [
        {
          frame: 16,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
          easing: { style: "Cubic", direction: "Out" },
        },
        {
          frame: 0,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
          easing: { style: "Linear", direction: "Out" },
        },
      ],
    },
  },
  markers: [{ id: "throw-marker", frame: 16, name: "THROW", value: "rock" }],
} as const;

describe(".rbanim V1 schema", () => {
  it("sorts and roundtrips project tracks and markers", () => {
    const parsed = parseRbanimProjectV1(JSON.stringify(validProject));
    expect(parsed.tracks.RightUpperArm.keyframes.map(({ frame }) => frame)).toEqual([
      0, 16,
    ]);
    expect(parsed.markers).toEqual(validProject.markers);
    expect(parseRbanimProjectV1(serializeRbanimProjectV1(parsed))).toEqual(parsed);
  });

  it("rejects invalid JSON, unknown/future schema and bad metadata", () => {
    expect(() => parseRbanimProjectV1("not json")).toThrow(RangeError);
    expect(() =>
      parseRbanimProjectV1(JSON.stringify({ ...validProject, schemaVersion: 2 })),
    ).toThrow(/Unsupported/);
    expect(() =>
      parseRbanimProjectV1(
        JSON.stringify({
          ...validProject,
          project: { ...validProject.project, rig: "R12" },
        }),
      ),
    ).toThrow(/rig/);
    expect(() =>
      parseRbanimProjectV1(
        JSON.stringify({ ...validProject, project: { ...validProject.project, fps: 0 } }),
      ),
    ).toThrow(/fps/);
  });

  it("rejects unknown joints, invalid quaternions, duplicate frames, and out-of-duration markers", () => {
    const unknownJoint = {
      ...validProject,
      tracks: { Missing: { ...validProject.tracks.RightUpperArm, jointId: "Missing" } },
    };
    expect(() => parseRbanimProjectV1(JSON.stringify(unknownJoint))).toThrow(
      /Unknown R15 joint/,
    );
    const zeroQuaternion = {
      ...validProject,
      tracks: {
        RightUpperArm: {
          ...validProject.tracks.RightUpperArm,
          keyframes: validProject.tracks.RightUpperArm.keyframes.map((keyframe, index) =>
            index === 0
              ? {
                  ...keyframe,
                  transform: { ...keyframe.transform, rotation: [0, 0, 0, 0] },
                }
              : keyframe,
          ),
        },
      },
    };
    expect(() => parseRbanimProjectV1(JSON.stringify(zeroQuaternion))).toThrow(
      RangeError,
    );
    const duplicateFrame = {
      ...validProject,
      tracks: {
        RightUpperArm: {
          ...validProject.tracks.RightUpperArm,
          keyframes: validProject.tracks.RightUpperArm.keyframes.map((keyframe) => ({
            ...keyframe,
            frame: 0,
          })),
        },
      },
    };
    expect(() => parseRbanimProjectV1(JSON.stringify(duplicateFrame))).toThrow(
      /duplicate frame/,
    );
    const lateMarker = {
      ...validProject,
      markers: [{ id: "late", frame: 23, name: "LATE" }],
    };
    expect(() => parseRbanimProjectV1(JSON.stringify(lateMarker))).toThrow(RangeError);
  });

  it("rejects projects larger than the schema size limit", () => {
    const largeProject = JSON.stringify({
      ...validProject,
      padding: "x".repeat(5 * 1024 * 1024),
    });
    expect(() => parseRbanimProjectV1(largeProject)).toThrow(/5 MB/);
  });
});

describe("save pose validation", () => {
  it("accepts the bind pose when there are no tracks", () => {
    expect(isPoseRepresentedByTracks("R15", {}, createBindPose(R15_RIG), 0)).toBe(true);
  });

  it("rejects preview-only pose edits when there are no tracks", () => {
    const pose = {
      ...createBindPose(R15_RIG),
      RightUpperArm: {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0.2, 0, 0.98] as [number, number, number, number],
      },
    };

    expect(isPoseRepresentedByTracks("R15", {}, pose, 0)).toBe(false);
  });

  it("accepts a pose represented by a keyframe at the current frame", () => {
    const pose = createBindPose(R15_RIG);
    const rotation = normalizeQuaternion([0, 0.2, 0, 0.98]);
    const transform = {
      position: [0, 0, 0] as [number, number, number],
      rotation,
    };
    const keyedPose = { ...pose, RightUpperArm: transform };

    expect(
      isPoseRepresentedByTracks(
        "R15",
        {
          RightUpperArm: {
            jointId: "RightUpperArm",
            keyframes: [
              {
                frame: 0,
                transform,
                easing: { style: "Linear", direction: "Out" },
              },
            ],
          },
        },
        keyedPose,
        0,
      ),
    ).toBe(true);
  });
});
