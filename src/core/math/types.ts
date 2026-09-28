/** A position or direction in the editor's canonical coordinate system. */
export type Vec3 = [number, number, number];

/** Quaternion components are always ordered [x, y, z, w]. */
export type Quat = [number, number, number, number];

export interface Transform {
  position: Vec3;
  rotation: Quat;
}
