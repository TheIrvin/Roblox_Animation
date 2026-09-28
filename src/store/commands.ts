import type { Quat, Vec3 } from "../core/math/types";
import {
  createBindPose,
  setJointLocalRotation,
  setJointPositionOffset,
} from "../core/rigs/pose";
import { R6_RIG } from "../core/rigs/r6";
import { R15_RIG } from "../core/rigs/r15";
import type { RigId } from "../core/rigs/types";
import {
  deleteKeyframe,
  moveKeyframe,
  upsertKeyframe,
  type JointKeyframe,
} from "../core/animation/keyframes";
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
  | { readonly type: "change-rig"; readonly rigId: RigId }
  | { readonly type: "add-keyframe"; readonly jointId: string; readonly frame: number }
  | { readonly type: "delete-keyframe"; readonly jointId: string; readonly frame: number }
  | {
      readonly type: "move-keyframe";
      readonly jointId: string;
      readonly sourceFrame: number;
      readonly targetFrame: number;
    }
  | {
      readonly type: "paste-keyframe";
      readonly jointId: string;
      readonly frame: number;
      readonly keyframe: JointKeyframe;
    }
  | { readonly type: "set-duration"; readonly durationFrames: number }
  | { readonly type: "set-fps"; readonly fps: number }
  | { readonly type: "set-loop"; readonly loop: boolean };

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
    case "add-keyframe":
      return `Add ${command.jointId} keyframe at ${command.frame}`;
    case "delete-keyframe":
      return `Delete ${command.jointId} keyframe at ${command.frame}`;
    case "move-keyframe":
      return `Move ${command.jointId} keyframe to ${command.targetFrame}`;
    case "paste-keyframe":
      return `Paste ${command.jointId} keyframe at ${command.frame}`;
    case "set-duration":
      return "Set animation duration";
    case "set-fps":
      return "Set animation FPS";
    case "set-loop":
      return "Set animation loop";
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
      return {
        ...document,
        rigId: command.rigId,
        pose: createBindPose(rigs[command.rigId]),
        tracks: {},
      };
    case "add-keyframe": {
      const joint = rigs[document.rigId].joints.find(
        (item) => item.id === command.jointId,
      );
      if (!joint) throw new RangeError(`Unknown joint ${command.jointId}.`);
      const track = upsertKeyframe(
        document.tracks[command.jointId],
        command.jointId,
        command.frame,
        document.pose[command.jointId],
        document.durationFrames,
      );
      return { ...document, tracks: { ...document.tracks, [command.jointId]: track } };
    }
    case "delete-keyframe":
      return {
        ...document,
        tracks: deleteKeyframe(document.tracks, command.jointId, command.frame),
      };
    case "move-keyframe":
      return {
        ...document,
        tracks: moveKeyframe(
          document.tracks,
          command.jointId,
          command.sourceFrame,
          command.targetFrame,
          document.durationFrames,
        ),
      };
    case "paste-keyframe": {
      const joint = rigs[document.rigId].joints.find(
        (item) => item.id === command.jointId,
      );
      if (!joint) throw new RangeError(`Unknown joint ${command.jointId}.`);
      const track = upsertKeyframe(
        document.tracks[command.jointId],
        command.jointId,
        command.frame,
        command.keyframe.transform,
        document.durationFrames,
        command.keyframe.easing,
      );
      return { ...document, tracks: { ...document.tracks, [command.jointId]: track } };
    }
    case "set-duration": {
      if (!Number.isSafeInteger(command.durationFrames) || command.durationFrames < 1)
        throw new RangeError("Duration must be a positive integer.");
      const maxFrame = Object.values(document.tracks).reduce(
        (maximum, track) =>
          Math.max(maximum, ...track.keyframes.map((keyframe) => keyframe.frame)),
        0,
      );
      if (command.durationFrames < maxFrame)
        throw new RangeError(`Duration cannot be shorter than frame ${maxFrame}.`);
      return { ...document, durationFrames: command.durationFrames };
    }
    case "set-fps":
      if (!Number.isSafeInteger(command.fps) || command.fps < 1 || command.fps > 240)
        throw new RangeError("FPS must be an integer from 1 to 240.");
      return { ...document, fps: command.fps };
    case "set-loop":
      return { ...document, loop: command.loop };
  }
}
