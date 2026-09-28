import type { Quat, Vec3 } from "../core/math/types";
import {
  createBindPose,
  setJointLocalRotation,
  setJointPositionOffset,
} from "../core/rigs/pose";
import { R6_RIG } from "../core/rigs/r6";
import { R15_RIG } from "../core/rigs/r15";
import type { RigId } from "../core/rigs/types";
import type { EditorDocument } from "./history";

const rigs = { R6: R6_RIG, R15: R15_RIG } as const;

/** User-intent commands. UI components dispatch these instead of mutating poses. */
export type EditorCommand =
  | {
      readonly type: "set-joint-rotation";
      readonly jointId: string;
      readonly rotation: Quat;
    }
  | {
      readonly type: "set-joint-position";
      readonly jointId: string;
      readonly position: Vec3;
    }
  | { readonly type: "reset-joint"; readonly jointId: string }
  | { readonly type: "reset-pose" }
  | { readonly type: "change-rig"; readonly rigId: RigId };

export function commandLabel(command: EditorCommand): string {
  switch (command.type) {
    case "set-joint-rotation":
      return `Rotate ${command.jointId}`;
    case "set-joint-position":
      return `Move ${command.jointId}`;
    case "reset-joint":
      return `Reset ${command.jointId}`;
    case "reset-pose":
      return "Reset pose";
    case "change-rig":
      return `Change rig to ${command.rigId}`;
  }
}

export function applyEditorCommand(
  document: EditorDocument,
  command: EditorCommand,
): EditorDocument {
  switch (command.type) {
    case "set-joint-rotation":
      return {
        ...document,
        pose: setJointLocalRotation(
          rigs[document.rigId],
          document.pose,
          command.jointId,
          command.rotation,
        ),
      };
    case "set-joint-position":
      return {
        ...document,
        pose: setJointPositionOffset(
          rigs[document.rigId],
          document.pose,
          command.jointId,
          command.position,
        ),
      };
    case "reset-joint": {
      const rig = rigs[document.rigId];
      const joint = rig.joints.find((candidate) => candidate.id === command.jointId);
      if (!joint) throw new RangeError(`Unknown joint ${command.jointId}.`);
      return {
        ...document,
        pose: {
          ...document.pose,
          [joint.id]: {
            position: [0, 0, 0],
            rotation: [0, 0, 0, 1],
          },
        },
      };
    }
    case "reset-pose":
      return { ...document, pose: createBindPose(rigs[document.rigId]) };
    case "change-rig":
      return { rigId: command.rigId, pose: createBindPose(rigs[command.rigId]) };
  }
}
