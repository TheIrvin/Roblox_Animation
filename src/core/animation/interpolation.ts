import { slerpQuaternions } from "../math/quaternion";
import { lerpVec3 } from "../math/vec3";
import type { Transform } from "../math/types";

export function interpolateTransform(
  a: Transform,
  b: Transform,
  alpha: number,
): Transform {
  if (!Number.isFinite(alpha))
    throw new RangeError("Interpolation alpha must be finite.");
  const t = Math.min(1, Math.max(0, alpha));
  return {
    position: lerpVec3(a.position, b.position, t),
    rotation: slerpQuaternions(a.rotation, b.rotation, t),
  };
}
