import type { Quat, Vec3 } from "../core/math/types";
import {
  createBindPose,
  setJointLocalRotation,
  setJointPositionOffset,
} from "../core/rigs/pose";
import { R6_RIG } from "../core/rigs/r6";
import { R15_RIG } from "../core/rigs/r15";
import type { RigId } from "../core/rigs/types";
import type { RigPose, JointPose } from "../core/rigs/pose";
import { normalizeQuaternion } from "../core/math/quaternion";
import { mirrorRigPose } from "../core/rigs/poseTools";
import {
  deleteKeyframe,
  moveKeyframe,
  upsertKeyframe,
  type JointKeyframe,
} from "../core/animation/keyframes";
import type { EditorDocument } from "./history";
import {
  addMarker,
  deleteMarker,
  moveMarker,
  renameMarker,
  type AnimationMarker,
} from "../core/animation/markers";

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
  | { readonly type: "set-loop"; readonly loop: boolean }
  | { readonly type: "paste-pose"; readonly pose: RigPose }
  | { readonly type: "paste-joint"; readonly jointId: string; readonly pose: JointPose }
  | { readonly type: "mirror-pose" }
  | { readonly type: "add-marker"; readonly marker: AnimationMarker }
  | { readonly type: "rename-marker"; readonly markerId: string; readonly name: string }
  | { readonly type: "move-marker"; readonly markerId: string; readonly frame: number }
  | { readonly type: "delete-marker"; readonly markerId: string }
  | { readonly type: "set-project-name"; readonly name: string };

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
    case "paste-pose":
      return "Paste pose";
    case "paste-joint":
      return `Paste ${command.jointId} pose`;
    case "mirror-pose":
      return "Mirror pose";
    case "add-marker":
      return `Add marker ${command.marker.name}`;
    case "rename-marker":
      return `Rename marker ${command.name}`;
    case "move-marker":
      return `Move marker to ${command.frame}`;
    case "delete-marker":
      return "Delete marker";
    case "set-project-name":
      return "Rename project";
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
      const maxKeyframe = Object.values(document.tracks).reduce(
        (maximum, track) =>
          Math.max(maximum, ...track.keyframes.map((keyframe) => keyframe.frame)),
        0,
      );
      const maxFrame = Math.max(
        maxKeyframe,
        ...document.markers.map((marker) => marker.frame),
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
    case "paste-pose": {
      const pose = {} as Record<string, JointPose>;
      for (const joint of rigs[document.rigId].joints) {
        const source = command.pose[joint.id];
        if (!source) throw new RangeError(`Pose is missing joint ${joint.id}.`);
        if (!source.position.every(Number.isFinite))
          throw new RangeError(`Pose position for ${joint.id} must be finite.`);
        pose[joint.id] = {
          position: [...source.position],
          rotation: normalizeQuaternion(source.rotation),
        };
      }
      return { ...document, pose };
    }
    case "paste-joint": {
      const joint = rigs[document.rigId].joints.find(
        (candidate) => candidate.id === command.jointId,
      );
      if (!joint) throw new RangeError(`Unknown joint ${command.jointId}.`);
      if (!command.pose.position.every(Number.isFinite))
        throw new RangeError(`Pose position for ${joint.id} must be finite.`);
      return {
        ...document,
        pose: {
          ...document.pose,
          [joint.id]: {
            position: [...command.pose.position],
            rotation: normalizeQuaternion(command.pose.rotation),
          },
        },
      };
    }
    case "mirror-pose":
      return {
        ...document,
        pose: mirrorRigPose(rigs[document.rigId], document.pose),
      };
    case "add-marker":
      return {
        ...document,
        markers: addMarker(document.markers, command.marker, document.durationFrames),
      };
    case "rename-marker":
      return {
        ...document,
        markers: renameMarker(document.markers, command.markerId, command.name),
      };
    case "move-marker":
      return {
        ...document,
        markers: moveMarker(
          document.markers,
          command.markerId,
          command.frame,
          document.durationFrames,
        ),
      };
    case "delete-marker":
      return {
        ...document,
        markers: deleteMarker(document.markers, command.markerId),
      };
    case "set-project-name": {
      const name = command.name.trim();
      if (!name) throw new RangeError("Project name cannot be empty.");
      if (name.length > 120)
        throw new RangeError("Project name cannot exceed 120 characters.");
      return { ...document, projectName: name };
    }
  }
}
