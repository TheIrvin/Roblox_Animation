import { describe, expect, it } from "vitest";
import {
  eulerXYZFromQuaternion,
  inverseQuaternion,
  multiplyQuaternions,
  normalizeQuaternion,
  quaternionFromEulerXYZ,
  quaternionIdentity,
  slerpQuaternions,
} from "./quaternion";
import { rotateVec3 } from "./vec3";

const closeTo = (actual: number[], expected: number[]) => {
  actual.forEach((component, index) => expect(component).toBeCloseTo(expected[index], 5));
  expect(actual.every(Number.isFinite)).toBe(true);
};

describe("quaternion math", () => {
  it("provides identity and normalizes without changing its rotation", () => {
    expect(quaternionIdentity()).toEqual([0, 0, 0, 1]);
    closeTo(normalizeQuaternion([0, 0, 0, 4]), [0, 0, 0, 1]);
    closeTo(normalizeQuaternion([2, 0, 0, 0]), [1, 0, 0, 0]);
  });

  it("rotates the canonical axes by positive 90 degree rotations", () => {
    const half = Math.PI / 4;
    closeTo(rotateVec3([0, 1, 0], [Math.sin(half), 0, 0, Math.cos(half)]), [0, 0, 1]);
    closeTo(rotateVec3([0, 0, 1], [0, Math.sin(half), 0, Math.cos(half)]), [1, 0, 0]);
    closeTo(rotateVec3([1, 0, 0], [0, 0, Math.sin(half), Math.cos(half)]), [0, 1, 0]);
  });

  it("slerps to the half-angle at the midpoint", () => {
    const end: [number, number, number, number] = [0, 0, 1, 0];
    const midpoint = slerpQuaternions(quaternionIdentity(), end, 0.5);
    closeTo(rotateVec3([1, 0, 0], midpoint), [0, 1, 0]);
  });

  it("multiplies by the inverse to identity, including non-unit inputs", () => {
    const value: [number, number, number, number] = [2, -1, 3, 4];
    closeTo(multiplyQuaternions(value, inverseQuaternion(value)), quaternionIdentity());
  });

  it("round-trips intrinsic XYZ Euler angles through a quaternion", () => {
    const euler: [number, number, number] = [0.31, -0.52, 1.17];
    const roundTrip = quaternionFromEulerXYZ(
      eulerXYZFromQuaternion(quaternionFromEulerXYZ(euler)),
    );
    const expected = quaternionFromEulerXYZ(euler);
    closeTo(roundTrip, expected);
  });

  it("rejects degenerate input instead of producing NaN", () => {
    expect(() => normalizeQuaternion([0, 0, 0, 0])).toThrow(RangeError);
    expect(() =>
      slerpQuaternions(quaternionIdentity(), [Number.NaN, 0, 0, 1], 0.5),
    ).toThrow(RangeError);
  });
});
