import { normalizeQuaternion } from "../math/quaternion";
import type { JointPose, RigPose } from "./pose";
import type { RigDefinition } from "./types";

function cloneJointPose(pose: JointPose): JointPose {
  return {
    position: [...pose.position],
    rotation: [...pose.rotation],
  };
}

/** Reflect a joint pose across the sagittal X=0 plane. */
export function mirrorJointPose(pose: JointPose): JointPose {
  const mirroredRotation = normalizeQuaternion([
    pose.rotation[0],
    -pose.rotation[1],
    -pose.rotation[2],
    pose.rotation[3],
  ]).map((component) => (component === 0 ? 0 : component)) as JointPose["rotation"];
  const mirroredX = -pose.position[0];
  return {
    position: [mirroredX === 0 ? 0 : mirroredX, pose.position[1], pose.position[2]],
    // For S = diag(-1, 1, 1), a mirrored rotation is S * R * S.
    rotation: mirroredRotation,
  };
}

/** Swap left/right joint transforms and reflect them across X=0. */
export function mirrorRigPose(
  rig: RigDefinition,
  pose: RigPose,
): Record<string, JointPose> {
  const mirrored: Record<string, JointPose> = {};
  for (const joint of rig.joints) {
    const source = pose[joint.id];
    if (!source) throw new RangeError(`Pose is missing joint ${joint.id}.`);
    if (joint.side === "center") {
      mirrored[joint.id] = cloneJointPose(source);
      continue;
    }
    const target = rig.joints.find((candidate) => candidate.id === joint.mirrorId);
    if (!target) throw new RangeError(`Mirror joint ${joint.mirrorId} does not exist.`);
    const pairedPose = pose[target.id];
    if (!pairedPose) throw new RangeError(`Pose is missing joint ${target.id}.`);
    mirrored[joint.id] = mirrorJointPose(pairedPose);
  }
  return mirrored;
}
