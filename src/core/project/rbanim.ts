import { normalizeQuaternion } from "../math/quaternion";
import type { Quat, Vec3 } from "../math/types";
import type { JointKeyframe, JointTrack } from "../animation/keyframes";
import { addMarker, type AnimationMarker } from "../animation/markers";
import { R6_RIG } from "../rigs/r6";
import { R15_RIG } from "../rigs/r15";
import type { RigId } from "../rigs/types";
import { createBindPose, type RigPose } from "../rigs/pose";
import { evaluateAnimationFrame } from "../animation/evaluator";

export const RBANIM_APP_NAME = "Roblox Animator Desktop" as const;
export const RBANIM_SCHEMA_VERSION = 1 as const;
export const RBANIM_MAX_BYTES = 5 * 1024 * 1024;

export type AnimationPriority =
  "Core" | "Idle" | "Movement" | "Action" | "Action2" | "Action3" | "Action4";

export interface RbanimProjectV1 {
  readonly schemaVersion: 1;
  readonly app: {
    readonly name: typeof RBANIM_APP_NAME;
    readonly createdWith: string;
  };
  readonly project: {
    readonly id: string;
    readonly name: string;
    readonly rig: RigId;
    readonly fps: number;
    readonly durationFrames: number;
    readonly loop: boolean;
    readonly priority: AnimationPriority;
  };
  readonly tracks: Readonly<Record<string, JointTrack>>;
  readonly markers: readonly AnimationMarker[];
}

const rigs = { R6: R6_RIG, R15: R15_RIG } as const;
const easingStyles = [
  "Linear",
  "Constant",
  "Elastic",
  "Cubic",
  "Bounce",
  "CubicV2",
] as const;
const easingDirections = ["In", "Out", "InOut"] as const;
const priorities = [
  "Core",
  "Idle",
  "Movement",
  "Action",
  "Action2",
  "Action3",
  "Action4",
] as const;

function record(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new RangeError(`${name} must be an object.`);
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new RangeError(`${name} must be a non-empty string.`);
  return value.trim();
}

function integer(
  value: unknown,
  name: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < minimum ||
    (value as number) > maximum
  )
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}.`);
  return value as number;
}

function tuple<T extends number[]>(value: unknown, length: number, name: string): T {
  if (!Array.isArray(value) || value.length !== length || !value.every(Number.isFinite))
    throw new RangeError(`${name} must contain ${length} finite numbers.`);
  return [...value] as T;
}

function validateTrackMap(
  value: unknown,
  rig: RigId,
  durationFrames: number,
): Record<string, JointTrack> {
  const input = record(value, "tracks");
  const validJoints = new Set(rigs[rig].joints.map((joint) => joint.id));
  const tracks: Record<string, JointTrack> = {};
  for (const [jointId, unknownTrack] of Object.entries(input)) {
    if (!validJoints.has(jointId))
      throw new RangeError(`Unknown ${rig} joint ${jointId}.`);
    const track = record(unknownTrack, `track ${jointId}`);
    if (track.jointId !== jointId)
      throw new RangeError(`Track key and jointId do not match for ${jointId}.`);
    if (!Array.isArray(track.keyframes) || track.keyframes.length === 0)
      throw new RangeError(`Track ${jointId} must contain keyframes.`);
    const frames = new Set<number>();
    const keyframes: JointKeyframe[] = track.keyframes
      .map((unknownKeyframe, index) => {
        const keyframe = record(unknownKeyframe, `${jointId} keyframe ${index}`);
        const frame = integer(keyframe.frame, `${jointId} frame`, 0, durationFrames);
        if (frames.has(frame))
          throw new RangeError(`Track ${jointId} has duplicate frame ${frame}.`);
        frames.add(frame);
        const transform = record(keyframe.transform, `${jointId} transform`);
        const position = tuple<Vec3>(transform.position, 3, `${jointId} position`);
        const rotation = normalizeQuaternion(
          tuple<Quat>(transform.rotation, 4, `${jointId} rotation`),
        );
        const easing = record(keyframe.easing, `${jointId} easing`);
        if (!(easingStyles as readonly unknown[]).includes(easing.style))
          throw new RangeError(`Track ${jointId} has an unknown easing style.`);
        if (!(easingDirections as readonly unknown[]).includes(easing.direction))
          throw new RangeError(`Track ${jointId} has an unknown easing direction.`);
        return {
          frame,
          transform: { position, rotation },
          easing: {
            style: easing.style as JointKeyframe["easing"]["style"],
            direction: easing.direction as JointKeyframe["easing"]["direction"],
          },
        };
      })
      .sort((left, right) => left.frame - right.frame);
    tracks[jointId] = { jointId, keyframes };
  }
  return tracks;
}

export function parseRbanimProjectV1(json: string): RbanimProjectV1 {
  if (new TextEncoder().encode(json).byteLength > RBANIM_MAX_BYTES)
    throw new RangeError("Project file exceeds the 5 MB size limit.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new RangeError("Project file contains invalid JSON.");
  }
  const root = record(parsed, "project file");
  if (root.schemaVersion !== RBANIM_SCHEMA_VERSION)
    throw new RangeError(
      `Unsupported project schema version ${String(root.schemaVersion)}.`,
    );
  const app = record(root.app, "app");
  if (app.name !== RBANIM_APP_NAME)
    throw new RangeError("Project app name is not supported.");
  const createdWith = nonEmptyString(app.createdWith, "app.createdWith");
  const project = record(root.project, "project");
  const id = nonEmptyString(project.id, "project.id");
  const name = nonEmptyString(project.name, "project.name");
  if (project.rig !== "R6" && project.rig !== "R15")
    throw new RangeError("Project rig must be R6 or R15.");
  const rig = project.rig;
  const fps = integer(project.fps, "project.fps", 1, 240);
  const durationFrames = integer(project.durationFrames, "project.durationFrames", 1);
  if (typeof project.loop !== "boolean")
    throw new RangeError("project.loop must be a boolean.");
  if (!(priorities as readonly unknown[]).includes(project.priority))
    throw new RangeError("Project priority is invalid.");
  const tracks = validateTrackMap(root.tracks, rig, durationFrames);
  if (!Array.isArray(root.markers)) throw new RangeError("markers must be an array.");
  let markers: AnimationMarker[] = [];
  for (const [index, unknownMarker] of root.markers.entries()) {
    const marker = record(unknownMarker, `marker ${index}`);
    const markerId = nonEmptyString(marker.id, `marker ${index}.id`);
    if (typeof marker.name !== "string")
      throw new RangeError(`Marker ${markerId} name must be a string.`);
    if (marker.value !== undefined && typeof marker.value !== "string")
      throw new RangeError(`Marker ${markerId} value must be a string.`);
    markers = addMarker(
      markers,
      {
        id: markerId,
        frame: integer(marker.frame, `marker ${markerId}.frame`, 0, durationFrames),
        name: marker.name,
        ...(marker.value === undefined ? {} : { value: marker.value }),
      },
      durationFrames,
    );
  }
  return {
    schemaVersion: RBANIM_SCHEMA_VERSION,
    app: { name: RBANIM_APP_NAME, createdWith },
    project: {
      id,
      name,
      rig,
      fps,
      durationFrames,
      loop: project.loop,
      priority: project.priority as AnimationPriority,
    },
    tracks,
    markers,
  };
}

export function serializeRbanimProjectV1(project: RbanimProjectV1): string {
  return JSON.stringify(parseRbanimProjectV1(JSON.stringify(project)), null, 2);
}

export function projectFromEditorDocument(document: {
  readonly projectId: string;
  readonly projectName: string;
  readonly priority: AnimationPriority;
  readonly rigId: RigId;
  readonly fps: number;
  readonly durationFrames: number;
  readonly loop: boolean;
  readonly tracks: Readonly<Record<string, JointTrack>>;
  readonly markers: readonly AnimationMarker[];
}): RbanimProjectV1 {
  return parseRbanimProjectV1(
    JSON.stringify({
      schemaVersion: RBANIM_SCHEMA_VERSION,
      app: { name: RBANIM_APP_NAME, createdWith: "0.1.0" },
      project: {
        id: document.projectId,
        name: document.projectName,
        rig: document.rigId,
        fps: document.fps,
        durationFrames: document.durationFrames,
        loop: document.loop,
        priority: document.priority,
      },
      tracks: document.tracks,
      markers: document.markers,
    }),
  );
}

/** The V1 file stores keyed tracks, so preview-only pose edits must be keyed before saving. */
export function isPoseRepresentedByTracks(
  rig: RigId,
  tracks: Readonly<Record<string, JointTrack>>,
  pose: RigPose,
  frame: number,
): boolean {
  const evaluated = evaluateAnimationFrame(tracks, createBindPose(rigs[rig]), frame);
  return JSON.stringify(evaluated) === JSON.stringify(pose);
}

export function createProjectId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `project-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}
