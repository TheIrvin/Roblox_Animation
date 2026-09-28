import {
  multiplyQuaternions,
  normalizeQuaternion,
  quaternionIdentity,
} from "./quaternion";
import { addVec3, rotateVec3, vec3 } from "./vec3";
import type { Transform } from "./types";

export const identityTransform = (): Transform => ({
  position: vec3(),
  rotation: quaternionIdentity(),
});

/** Compose parent * local, consistent with finalLocal = bindLocal * deltaLocal. */
export function composeTransforms(parent: Transform, local: Transform): Transform {
  return {
    position: addVec3(parent.position, rotateVec3(local.position, parent.rotation)),
    rotation: normalizeQuaternion(multiplyQuaternions(parent.rotation, local.rotation)),
  };
}
