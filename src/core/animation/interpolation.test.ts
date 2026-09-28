import { describe, expect, it } from "vitest";
import { interpolateTransform } from "./interpolation";
import { identityTransform, composeTransforms } from "../math/transform";
import { quaternionFromEulerXYZ, quaternionIdentity } from "../math/quaternion";

describe("transform math", () => {
  it("composes with identity on either side", () => {
    const value = {
      position: [1, 2, -3] as [number, number, number],
      rotation: quaternionFromEulerXYZ([0.2, -0.4, 0.1]),
    };
    const left = composeTransforms(identityTransform(), value);
    expect(left.position).toEqual(value.position);
    left.rotation.forEach((component, index) =>
      expect(component).toBeCloseTo(value.rotation[index], 5),
    );
    const composed = composeTransforms(value, identityTransform());
    expect(composed.position).toEqual(value.position);
    composed.rotation.forEach((component, index) =>
      expect(component).toBeCloseTo(value.rotation[index], 5),
    );
  });

  it("rotates a local translation when composing parent and local transforms", () => {
    const parent = {
      position: [2, 0, 0] as [number, number, number],
      rotation: quaternionFromEulerXYZ([0, 0, Math.PI / 2]),
    };
    const local = {
      position: [1, 0, 0] as [number, number, number],
      rotation: quaternionIdentity(),
    };
    const composed = composeTransforms(parent, local);
    expect(composed.position[0]).toBeCloseTo(2, 5);
    expect(composed.position[1]).toBeCloseTo(1, 5);
    expect(composed.position[2]).toBeCloseTo(0, 5);
  });

  it("interpolates position linearly and rotation with slerp", () => {
    const start = identityTransform();
    const end = {
      position: [10, 4, -2] as [number, number, number],
      rotation: quaternionFromEulerXYZ([0, 0, Math.PI / 2]),
    };
    const midpoint = interpolateTransform(start, end, 0.5);
    expect(midpoint.position).toEqual([5, 2, -1]);
    expect(midpoint.rotation[2]).toBeCloseTo(Math.sin(Math.PI / 8), 5);
    expect(midpoint.rotation[3]).toBeCloseTo(Math.cos(Math.PI / 8), 5);
    expect(interpolateTransform(start, end, 2)).toEqual(end);
  });
});
