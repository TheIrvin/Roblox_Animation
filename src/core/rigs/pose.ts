import {
  inverseQuaternion,
  multiplyQuaternions,
  normalizeQuaternion,
  quaternionIdentity,
} from "../math/quaternion";
import type { Quat, Vec3 } from "../math/types";
import type { RigDefinition } from "./types";

/** Editable local offsets from a rig's canonical bind transforms. */
export interface JointPose {
  readonly position: Vec3;
  readonly rotation: Quat;
}

export type RigPose = Readonly<Record<string, JointPose>>;

export function createBindPose(rig: RigDefinition): Record<string, JointPose> {
  return Object.fromEntries(
    rig.joints.map(({ id }) => [
      id,
      { position: [0, 0, 0], rotation: quaternionIdentity() },
    ]),
  );
}

/** Store an absolute local rotation as an offset from the rig bind rotation. */
export function setJointLocalRotation(
  rig: RigDefinition,
  pose: RigPose,
  jointId: string,
  localRotation: Quat,
): Record<string, JointPose> {
  const joint = rig.joints.find((candidate) => candidate.id === jointId);
  if (!joint?.editableRotation)
    throw new RangeError(`Joint ${jointId} cannot be rotated.`);
  const current = pose[jointId];
  if (!current) throw new RangeError(`Joint ${jointId} has no pose entry.`);
  const normalized = normalizeQuaternion(localRotation);
  const delta = normalizeQuaternion(
    multiplyQuaternions(inverseQuaternion(joint.bindRotation), normalized),
  );
  return { ...pose, [jointId]: { ...current, rotation: delta } };
}

export function setJointPositionOffset(
  rig: RigDefinition,
  pose: RigPose,
  jointId: string,
  position: Vec3,
): Record<string, JointPose> {
  const joint = rig.joints.find((candidate) => candidate.id === jointId);
  if (!joint?.editablePosition)
    throw new RangeError(`Joint ${jointId} position cannot be changed.`);
  if (!position.every(Number.isFinite))
    throw new RangeError("Joint position must be finite.");
  const current = pose[jointId];
  if (!current) throw new RangeError(`Joint ${jointId} has no pose entry.`);
  return { ...pose, [jointId]: { ...current, position: [...position] as Vec3 } };
}

export function localRotationForJoint(
  rig: RigDefinition,
  pose: RigPose,
  jointId: string,
): Quat {
  const joint = rig.joints.find((candidate) => candidate.id === jointId);
  const current = pose[jointId];
  if (!joint || !current) throw new RangeError(`Unknown joint ${jointId}.`);
  return normalizeQuaternion(multiplyQuaternions(joint.bindRotation, current.rotation));
}
