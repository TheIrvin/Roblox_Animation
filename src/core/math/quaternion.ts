import type { Quat, Vec3 } from "./types";

const MIN_NORM = 1e-12;

export const quaternionIdentity = (): Quat => [0, 0, 0, 1];

export function normalizeQuaternion(value: Quat): Quat {
  const norm = Math.hypot(value[0], value[1], value[2], value[3]);
  if (!Number.isFinite(norm) || norm < MIN_NORM) {
    throw new RangeError("Cannot normalize a zero or non-finite quaternion.");
  }
  return [value[0] / norm, value[1] / norm, value[2] / norm, value[3] / norm];
}

/** Hamilton product: the returned rotation applies b, then a. */
export function multiplyQuaternions(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function inverseQuaternion(value: Quat): Quat {
  const normSquared = value[0] ** 2 + value[1] ** 2 + value[2] ** 2 + value[3] ** 2;
  if (!Number.isFinite(normSquared) || normSquared < MIN_NORM ** 2) {
    throw new RangeError("Cannot invert a zero or non-finite quaternion.");
  }
  return [
    -value[0] / normSquared,
    -value[1] / normSquared,
    -value[2] / normSquared,
    value[3] / normSquared,
  ];
}

export function slerpQuaternions(aInput: Quat, bInput: Quat, alpha: number): Quat {
  if (!Number.isFinite(alpha)) throw new RangeError("Slerp alpha must be finite.");
  const a = normalizeQuaternion(aInput);
  let b = normalizeQuaternion(bInput);
  const t = Math.min(1, Math.max(0, alpha));
  let cosine = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

  // q and -q encode the same rotation; choose the short arc.
  if (cosine < 0) {
    b = [-b[0], -b[1], -b[2], -b[3]];
    cosine = -cosine;
  }

  if (cosine > 0.9995) {
    return normalizeQuaternion([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ]);
  }

  const angle = Math.acos(Math.min(1, cosine));
  const sinAngle = Math.sin(angle);
  const weightA = Math.sin((1 - t) * angle) / sinAngle;
  const weightB = Math.sin(t * angle) / sinAngle;
  return normalizeQuaternion([
    a[0] * weightA + b[0] * weightB,
    a[1] * weightA + b[1] * weightB,
    a[2] * weightA + b[2] * weightB,
    a[3] * weightA + b[3] * weightB,
  ]);
}

/** Convert intrinsic XYZ Euler angles in radians to [x,y,z,w]. */
export function quaternionFromEulerXYZ(euler: Vec3): Quat {
  const [x, y, z] = euler.map((angle) => angle / 2) as Vec3;
  const c1 = Math.cos(x);
  const c2 = Math.cos(y);
  const c3 = Math.cos(z);
  const s1 = Math.sin(x);
  const s2 = Math.sin(y);
  const s3 = Math.sin(z);
  return normalizeQuaternion([
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ]);
}

/** Convert [x,y,z,w] to intrinsic XYZ Euler angles in radians. */
export function eulerXYZFromQuaternion(value: Quat): Vec3 {
  const [x, y, z, w] = normalizeQuaternion(value);
  const sinY = 2 * (x * z + w * y);
  const pitch = Math.asin(Math.max(-1, Math.min(1, sinY)));
  const nearGimbalLock = Math.abs(sinY) >= 1 - 1e-10;
  const roll = nearGimbalLock
    ? 2 * Math.atan2(x, w)
    : Math.atan2(2 * (w * x - y * z), 1 - 2 * (x * x + y * y));
  const yaw = nearGimbalLock
    ? 0
    : Math.atan2(2 * (w * z - x * y), 1 - 2 * (y * y + z * z));
  return [roll, pitch, yaw];
}
