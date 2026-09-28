import { describe, expect, it } from "vitest";
import { quaternionFromEulerXYZ } from "../math/quaternion";
import { R15_RIG } from "./r15";
import {
  createBindPose,
  localRotationForJoint,
  setJointLocalRotation,
  setJointPositionOffset,
} from "./pose";

describe("rig pose transforms", () => {
  it("keeps transforms independent of renderer objects and updates immutably", () => {
    const pose = createBindPose(R15_RIG);
    const rotation = quaternionFromEulerXYZ([0.3, 0, 0]);
    const updated = setJointLocalRotation(R15_RIG, pose, "RightUpperArm", rotation);

    expect(updated).not.toBe(pose);
    expect(updated.RightUpperArm).not.toBe(pose.RightUpperArm);
    expect(pose.RightUpperArm.rotation).toEqual([0, 0, 0, 1]);
    expect(localRotationForJoint(R15_RIG, updated, "RightUpperArm")).toEqual(rotation);
  });

  it("accepts editable root position offsets and rejects body translation", () => {
    const pose = createBindPose(R15_RIG);
    expect(
      setJointPositionOffset(R15_RIG, pose, "HumanoidRootPart", [1, 2, 3])
        .HumanoidRootPart.position,
    ).toEqual([1, 2, 3]);
    expect(() =>
      setJointPositionOffset(R15_RIG, pose, "RightUpperArm", [1, 0, 0]),
    ).toThrow(RangeError);
    expect(() =>
      setJointPositionOffset(R15_RIG, pose, "HumanoidRootPart", [Number.NaN, 0, 0]),
    ).toThrow(RangeError);
  });

  it("rejects unknown joints and invalid rotations", () => {
    const pose = createBindPose(R15_RIG);
    expect(() => setJointLocalRotation(R15_RIG, pose, "missing", [0, 0, 0, 1])).toThrow(
      RangeError,
    );
    expect(() =>
      setJointLocalRotation(R15_RIG, pose, "RightUpperArm", [0, 0, 0, 0]),
    ).toThrow(RangeError);
  });
});
