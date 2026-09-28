import type { Quat, Vec3 } from "./types";

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z];

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subtractVec3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scaleVec3(value: Vec3, scalar: number): Vec3 {
  return [value[0] * scalar, value[1] * scalar, value[2] * scalar];
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function lengthVec3(value: Vec3): number {
  return Math.hypot(value[0], value[1], value[2]);
}

export function normalizeVec3(value: Vec3): Vec3 {
  const length = lengthVec3(value);
  if (!Number.isFinite(length) || length <= Number.EPSILON) {
    throw new RangeError("Cannot normalize a zero or non-finite Vec3.");
  }
  return scaleVec3(value, 1 / length);
}

export function lerpVec3(a: Vec3, b: Vec3, alpha: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * alpha,
    a[1] + (b[1] - a[1]) * alpha,
    a[2] + (b[2] - a[2]) * alpha,
  ];
}

/** Rotate a vector by a unit quaternion. */
export function rotateVec3(value: Vec3, rotation: Quat): Vec3 {
  const [x, y, z] = value;
  const [qx, qy, qz, qw] = rotation;
  // q * [v, 0] * conjugate(q), expanded to avoid temporary quaternions.
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + qy * tz - qz * ty,
    y + qw * ty + qz * tx - qx * tz,
    z + qw * tz + qx * ty - qy * tx,
  ];
}
