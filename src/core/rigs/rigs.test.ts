import { describe, expect, it } from "vitest";
import { R6_RIG } from "./r6";
import { R15_RIG } from "./r15";
import { validateRigDefinition } from "./validate";
import type { RigDefinition } from "./types";

const rigDefinitions = [R6_RIG, R15_RIG];

describe("R6 and R15 rig definitions", () => {
  it.each(rigDefinitions)(
    "$displayName has unique IDs and complete parent references",
    (rig) => {
      expect(new Set(rig.joints.map((joint) => joint.id)).size).toBe(rig.joints.length);
      const ids = new Set(rig.joints.map((joint) => joint.id));
      expect(
        rig.joints.filter((joint) => joint.parentId === null).map((joint) => joint.id),
      ).toEqual([rig.rootId]);
      for (const joint of rig.joints) {
        expect(joint.parentId === null || ids.has(joint.parentId)).toBe(true);
      }
      expect(validateRigDefinition(rig)).toEqual({ valid: true, errors: [] });
    },
  );

  it("contains the canonical part IDs described for R6 and R15 Block", () => {
    expect(R6_RIG.joints.map((joint) => joint.id)).toEqual([
      "HumanoidRootPart",
      "Torso",
      "Head",
      "Left Arm",
      "Right Arm",
      "Left Leg",
      "Right Leg",
    ]);
    expect(R15_RIG.joints.map((joint) => joint.id)).toEqual([
      "HumanoidRootPart",
      "LowerTorso",
      "UpperTorso",
      "Head",
      "LeftUpperArm",
      "LeftLowerArm",
      "LeftHand",
      "RightUpperArm",
      "RightLowerArm",
      "RightHand",
      "LeftUpperLeg",
      "LeftLowerLeg",
      "LeftFoot",
      "RightUpperLeg",
      "RightLowerLeg",
      "RightFoot",
    ]);
  });

  it.each(rigDefinitions)("$displayName has symmetric mirror metadata", (rig) => {
    const byId = new Map(rig.joints.map((joint) => [joint.id, joint]));
    for (const joint of rig.joints) {
      expect(byId.get(joint.mirrorId)?.mirrorId).toBe(joint.id);
      if (joint.side === "center") expect(joint.mirrorId).toBe(joint.id);
      if (joint.side === "left") expect(byId.get(joint.mirrorId)?.side).toBe("right");
      if (joint.side === "right") expect(byId.get(joint.mirrorId)?.side).toBe("left");
    }
  });

  it.each(rigDefinitions)(
    "$displayName has valid unit bind quaternions and box metadata",
    (rig) => {
      for (const joint of rig.joints) {
        expect(Math.hypot(...joint.bindRotation)).toBeCloseTo(1, 6);
        expect(joint.visual.shape).toBe("box");
        expect(joint.visual.size.every((dimension) => dimension > 0)).toBe(true);
        expect(joint.bindPosition.every(Number.isFinite)).toBe(true);
      }
    },
  );
});

describe("validateRigDefinition", () => {
  it("rejects cycles", () => {
    const cyclic: RigDefinition = {
      ...R6_RIG,
      joints: R6_RIG.joints.map((joint) =>
        joint.id === "Torso" ? { ...joint, parentId: "Head" } : joint,
      ),
    };
    expect(validateRigDefinition(cyclic).errors.map((error) => error.code)).toContain(
      "cycle",
    );
  });

  it("rejects missing parents and disconnected joints", () => {
    const malformed: RigDefinition = {
      ...R6_RIG,
      joints: R6_RIG.joints.map((joint) =>
        joint.id === "Left Arm" ? { ...joint, parentId: "Missing" } : joint,
      ),
    };
    const codes = validateRigDefinition(malformed).errors.map((error) => error.code);
    expect(codes).toContain("missing-parent");
    expect(codes).toContain("disconnected");
  });

  it("rejects asymmetric mirror pairs, non-unit binds, and invalid geometry", () => {
    const malformed: RigDefinition = {
      ...R6_RIG,
      joints: R6_RIG.joints.map((joint) => {
        if (joint.id === "Left Arm") {
          return {
            ...joint,
            mirrorId: "Head",
            bindRotation: [0, 0, 0, 2],
            visual: { ...joint.visual, size: [0, 2, 1] },
          };
        }
        return joint;
      }),
    };
    const codes = validateRigDefinition(malformed).errors.map((error) => error.code);
    expect(codes).toContain("invalid-mirror");
    expect(codes).toContain("invalid-bind-rotation");
    expect(codes).toContain("invalid-visual");
  });
});
