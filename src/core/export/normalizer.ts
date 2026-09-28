import { evaluateAnimationFrame } from "../animation/evaluator";
import type { JointKeyframe } from "../animation/keyframes";
import type { AnimationMarker } from "../animation/markers";
import type { RbanimProjectV1 } from "../project/rbanim";
import { parseRbanimProjectV1 } from "../project/rbanim";
import { createBindPose } from "../rigs/pose";
import { R6_RIG } from "../rigs/r6";
import { R15_RIG } from "../rigs/r15";
import type { RigDefinition } from "../rigs/types";

export interface ExportPoseV1 {
  readonly jointId: string;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number, number];
  readonly easing: JointKeyframe["easing"];
}

export interface ExportFrameV1 {
  readonly frame: number;
  readonly timeSeconds: number;
  readonly poses: readonly ExportPoseV1[];
  readonly markers: readonly AnimationMarker[];
}

export interface ExportEnvelopeV1 {
  readonly protocolVersion: 1;
  readonly exportId: string;
  readonly createdAt: string;
  readonly project: RbanimProjectV1;
  readonly frames: readonly ExportFrameV1[];
}

export interface ExportDiagnostic {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly message: string;
  readonly frame?: number;
  readonly jointId?: string;
}

export interface ExportNormalizationResult {
  readonly envelope: ExportEnvelopeV1 | null;
  readonly diagnostics: readonly ExportDiagnostic[];
}

export interface ExportMetadata {
  readonly exportId: string;
  readonly createdAt: string;
}

const rigDefinitions: Readonly<Record<RbanimProjectV1["project"]["rig"], RigDefinition>> =
  {
    R6: R6_RIG,
    R15: R15_RIG,
  };

function newExportId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `export-${Date.now()}`;
}

function validateProject(project: RbanimProjectV1): {
  readonly project: RbanimProjectV1 | null;
  readonly diagnostics: ExportDiagnostic[];
} {
  try {
    return { project: parseRbanimProjectV1(JSON.stringify(project)), diagnostics: [] };
  } catch (error) {
    return {
      project: null,
      diagnostics: [
        {
          severity: "error",
          code: "INVALID_PROJECT",
          message: error instanceof Error ? error.message : "Project is invalid.",
        },
      ],
    };
  }
}

/** Normalizes sparse editor tracks into deterministic, complete rig poses. */
export function normalizeProjectForExport(
  project: RbanimProjectV1,
  metadata: ExportMetadata = {
    exportId: newExportId(),
    createdAt: new Date().toISOString(),
  },
): ExportNormalizationResult {
  const validated = validateProject(project);
  const diagnostics = validated.diagnostics;
  if (!validated.project) return { envelope: null, diagnostics };
  const normalizedProject = validated.project;

  if (!metadata.exportId.trim()) {
    diagnostics.push({
      severity: "error",
      code: "INVALID_EXPORT_ID",
      message: "Export ID must not be empty.",
    });
  }
  if (!Number.isFinite(Date.parse(metadata.createdAt))) {
    diagnostics.push({
      severity: "error",
      code: "INVALID_CREATED_AT",
      message: "Export timestamp must be a valid ISO date.",
    });
  }
  if (diagnostics.length > 0) return { envelope: null, diagnostics };

  const rig = rigDefinitions[normalizedProject.project.rig];
  const bindPose = createBindPose(rig);
  const globalFrames = new Set<number>([0]);
  for (const track of Object.values(normalizedProject.tracks)) {
    for (const keyframe of track.keyframes) globalFrames.add(keyframe.frame);
  }
  for (const marker of normalizedProject.markers) globalFrames.add(marker.frame);

  const markersByFrame = new Map<number, AnimationMarker[]>();
  for (const marker of [...normalizedProject.markers].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const frameMarkers = markersByFrame.get(marker.frame) ?? [];
    frameMarkers.push(marker);
    markersByFrame.set(marker.frame, frameMarkers);
  }

  const frames: ExportFrameV1[] = [...globalFrames]
    .sort((a, b) => a - b)
    .map((frame) => {
      const evaluatedPose = evaluateAnimationFrame(
        normalizedProject.tracks,
        bindPose,
        frame,
      );
      return {
        frame,
        timeSeconds: frame / normalizedProject.project.fps,
        poses: rig.joints.map((joint) => {
          const keyframes = normalizedProject.tracks[joint.id]?.keyframes ?? [];
          const activeKeyframe =
            [...keyframes].reverse().find((keyframe) => keyframe.frame <= frame) ??
            keyframes[0];
          const transform = evaluatedPose[joint.id] ?? {
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0, 1] as [number, number, number, number],
          };
          return {
            jointId: joint.id,
            position: [...transform.position] as [number, number, number],
            rotation: [...transform.rotation] as [number, number, number, number],
            easing: activeKeyframe?.easing ?? { style: "Linear", direction: "Out" },
          };
        }),
        markers: markersByFrame.get(frame) ?? [],
      };
    });

  const envelope: ExportEnvelopeV1 = {
    protocolVersion: 1,
    exportId: metadata.exportId,
    createdAt: new Date(metadata.createdAt).toISOString(),
    project: normalizedProject,
    frames,
  };
  return { envelope, diagnostics };
}
