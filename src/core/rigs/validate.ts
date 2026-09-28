import type {
  RigDefinition,
  RigJointDefinition,
  RigValidationError,
  RigValidationResult,
} from "./types";

const UNIT_QUATERNION_TOLERANCE = 1e-5;

function isFiniteTuple(values: readonly number[]): boolean {
  return values.every(Number.isFinite);
}

function addError(
  errors: RigValidationError[],
  code: RigValidationError["code"],
  message: string,
  jointId?: string,
): void {
  errors.push(jointId === undefined ? { code, message } : { code, jointId, message });
}

export function validateRigDefinition(definition: RigDefinition): RigValidationResult {
  const errors: RigValidationError[] = [];
  const byId = new Map<string, RigJointDefinition>();
  const duplicateIds = new Set<string>();

  for (const joint of definition.joints) {
    if (byId.has(joint.id)) {
      duplicateIds.add(joint.id);
      addError(errors, "duplicate-id", `Joint ID "${joint.id}" is duplicated.`, joint.id);
    } else {
      byId.set(joint.id, joint);
    }
  }

  const roots = definition.joints.filter((joint) => joint.parentId === null);
  if (!byId.has(definition.rootId)) {
    addError(errors, "missing-root", `Root joint "${definition.rootId}" does not exist.`);
  } else if (roots.length !== 1 || roots[0]?.id !== definition.rootId) {
    addError(
      errors,
      "invalid-root",
      "The declared root must be the only joint without a parent.",
    );
  }

  for (const joint of definition.joints) {
    if (joint.parentId === joint.id) {
      addError(
        errors,
        "self-parent",
        `Joint "${joint.id}" cannot parent itself.`,
        joint.id,
      );
    } else if (joint.parentId !== null && !byId.has(joint.parentId)) {
      addError(
        errors,
        "missing-parent",
        `Parent joint "${joint.parentId}" does not exist.`,
        joint.id,
      );
    }

    const mirror = byId.get(joint.mirrorId);
    if (
      !mirror ||
      mirror.mirrorId !== joint.id ||
      (joint.side === "center" &&
        (joint.mirrorId !== joint.id || mirror.side !== "center")) ||
      (joint.side === "left" && mirror.side !== "right") ||
      (joint.side === "right" && mirror.side !== "left")
    ) {
      addError(
        errors,
        "invalid-mirror",
        `Joint "${joint.id}" has an invalid mirror mapping.`,
        joint.id,
      );
    }

    if (!isFiniteTuple(joint.bindPosition)) {
      addError(
        errors,
        "invalid-bind-position",
        `Joint "${joint.id}" has a non-finite bind position.`,
        joint.id,
      );
    }

    const rotationNorm = Math.hypot(...joint.bindRotation);
    if (
      !Number.isFinite(rotationNorm) ||
      rotationNorm === 0 ||
      Math.abs(rotationNorm - 1) > UNIT_QUATERNION_TOLERANCE
    ) {
      addError(
        errors,
        "invalid-bind-rotation",
        `Joint "${joint.id}" bind rotation must be a finite unit quaternion.`,
        joint.id,
      );
    }

    if (
      !isFiniteTuple(joint.visual.size) ||
      joint.visual.size.some((dimension) => dimension <= 0) ||
      !isFiniteTuple(joint.visual.offset) ||
      (joint.visual.shape !== "box" && joint.visual.shape !== "sphere")
    ) {
      addError(
        errors,
        "invalid-visual",
        `Joint "${joint.id}" has invalid primitive geometry metadata.`,
        joint.id,
      );
    }
  }

  const visitState = new Map<string, "visiting" | "visited">();
  const visit = (jointId: string): void => {
    const state = visitState.get(jointId);
    if (state === "visiting") {
      addError(
        errors,
        "cycle",
        `Rig hierarchy contains a cycle at "${jointId}".`,
        jointId,
      );
      return;
    }
    if (state === "visited") return;

    visitState.set(jointId, "visiting");
    const joint = byId.get(jointId);
    if (joint?.parentId && byId.has(joint.parentId)) visit(joint.parentId);
    visitState.set(jointId, "visited");
  };
  for (const id of byId.keys()) visit(id);

  if (byId.has(definition.rootId)) {
    const reachable = new Set<string>();
    const visitChildren = (parentId: string): void => {
      if (reachable.has(parentId)) return;
      reachable.add(parentId);
      for (const child of definition.joints) {
        if (child.parentId === parentId) visitChildren(child.id);
      }
    };
    visitChildren(definition.rootId);
    for (const joint of definition.joints) {
      if (!reachable.has(joint.id) && !duplicateIds.has(joint.id)) {
        addError(
          errors,
          "disconnected",
          `Joint "${joint.id}" is not connected to the root.`,
          joint.id,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
