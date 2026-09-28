import type { Quat, Vec3 } from "../math/types";

export type RigId = "R6" | "R15";
export type RigSide = "center" | "left" | "right";
export type PrimitiveShape = "box" | "sphere";

export interface RigJointDefinition {
  readonly id: string;
  readonly parentId: string | null;
  readonly displayName: string;
  readonly side: RigSide;
  readonly mirrorId: string;
  readonly editableRotation: boolean;
  readonly editablePosition: boolean;
  readonly bindPosition: Vec3;
  readonly bindRotation: Quat;
  readonly visual: {
    readonly shape: PrimitiveShape;
    readonly size: Vec3;
    readonly offset: Vec3;
  };
}

export interface RigDefinition {
  readonly id: RigId;
  readonly displayName: string;
  readonly rootId: string;
  readonly joints: readonly RigJointDefinition[];
}

export type RigValidationErrorCode =
  | "duplicate-id"
  | "missing-root"
  | "invalid-root"
  | "missing-parent"
  | "self-parent"
  | "cycle"
  | "disconnected"
  | "invalid-mirror"
  | "invalid-side"
  | "invalid-bind-position"
  | "invalid-bind-rotation"
  | "invalid-visual";

export interface RigValidationError {
  readonly code: RigValidationErrorCode;
  readonly jointId?: string;
  readonly message: string;
}

export interface RigValidationResult {
  readonly valid: boolean;
  readonly errors: readonly RigValidationError[];
}
