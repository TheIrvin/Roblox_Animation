import { describe, expect, it } from "vitest";
import { quaternionFromEulerXYZ } from "../math/quaternion";
import { createBindPose } from "./pose";
import { mirrorRigPose, mirrorJointPose } from "./poseTools";
import { R6_RIG } from "./r6";
import { R15_RIG } from "./r15";
import type { RigDefinition } from "./types";

function expectPosesClose(
  actual: ReturnType<typeof createBindPose>,
  expected: ReturnType<typeof createBindPose>,
) {
  for (const jointId of Object.keys(expected)) {
    actual[jointId].position.forEach((value, index) =>
      expect(value).toBeCloseTo(expected[jointId].position[index], 6),
    );
    actual[jointId].rotation.forEach((value, index) =>
      expect(value).toBeCloseTo(expected[jointId].rotation[index], 6),
    );
  }
}

describe.each([R6_RIG, R15_RIG] satisfies RigDefinition[])("$id pose mirror", (rig) => {
  it("preserves central joints and swaps/refects left and right limbs", () => {
    const pose = createBindPose(rig);
    pose.HumanoidRootPart = {
      position: [2, 3, -1],
      rotation: quaternionFromEulerXYZ([0.2, -0.1, 0.3]),
    };
    const leftId = rig.joints.find((joint) => joint.side === "left")!.id;
    const rightId = rig.joints.find((joint) => joint.side === "right")!.id;
    pose[leftId] = {
      position: [1, 2, 3],
      rotation: quaternionFromEulerXYZ([Math.PI / 4, 0, 0]),
    };
    pose[rightId] = {
      position: [-4, 5, -6],
      rotation: quaternionFromEulerXYZ([0, 0, Math.PI]),
    };

    const mirrored = mirrorRigPose(rig, pose);
    expect(mirrored.HumanoidRootPart).toEqual(pose.HumanoidRootPart);
    expect(mirrored[leftId].position).toEqual([4, 5, -6]);
    expect(mirrored[rightId].position).toEqual([-1, 2, 3]);
    expectPosesClose(mirrorRigPose(rig, mirrored), pose);
  });

  it("mirrors identity, a 45-degree arm, and a backward-facing rotation", () => {
    const identity = {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    };
    expect(mirrorJointPose(identity)).toEqual(identity);
    const rotations = [
      quaternionFromEulerXYZ([Math.PI / 4, 0, 0]),
      quaternionFromEulerXYZ([0, Math.PI, 0]),
    ];
    for (const rotation of rotations) {
      const original = {
        position: [0.7, -0.2, 0.4] as [number, number, number],
        rotation,
      };
      expectPosesClose(
        { Joint: mirrorJointPose(mirrorJointPose(original)) },
        { Joint: original },
      );
    }
  });
});
