import { normalizeQuaternion } from "../math/quaternion";
import type { JointPose } from "../rigs/pose";
import type { PoseEasingDirection, PoseEasingStyle } from "./easing";

export interface JointKeyframe {
  readonly frame: number;
  readonly transform: JointPose;
  readonly easing: {
    readonly style: PoseEasingStyle;
    readonly direction: PoseEasingDirection;
  };
}

export interface JointTrack {
  readonly jointId: string;
  readonly keyframes: readonly JointKeyframe[];
}

export type AnimationTracks = Readonly<Record<string, JointTrack>>;

export const DEFAULT_KEYFRAME_EASING = {
  style: "Cubic",
  direction: "Out",
} as const satisfies JointKeyframe["easing"];

function assertFrame(frame: number, durationFrames: number): void {
  if (!Number.isSafeInteger(frame) || frame < 0)
    throw new RangeError("Keyframe must be a non-negative integer.");
  if (!Number.isSafeInteger(durationFrames) || durationFrames < 1)
    throw new RangeError("Animation duration must be a positive integer.");
  if (frame > durationFrames)
    throw new RangeError(
      `Frame ${frame} is outside the ${durationFrames}-frame duration.`,
    );
}

function snapshotPose(transform: JointPose): JointPose {
  if (!transform.position.every(Number.isFinite))
    throw new RangeError("Keyframe position must contain finite values.");
  return {
    position: [...transform.position],
    rotation: normalizeQuaternion(transform.rotation),
  };
}

export function upsertKeyframe(
  track: JointTrack | undefined,
  jointId: string,
  frame: number,
  transform: JointPose,
  durationFrames: number,
  easing: JointKeyframe["easing"] = DEFAULT_KEYFRAME_EASING,
): JointTrack {
  assertFrame(frame, durationFrames);
  const keyframe: JointKeyframe = {
    frame,
    transform: snapshotPose(transform),
    easing: { ...easing },
  };
  const keyframes = [...(track?.keyframes ?? [])];
  const existingIndex = keyframes.findIndex((candidate) => candidate.frame === frame);
  if (existingIndex >= 0) keyframes[existingIndex] = keyframe;
  else keyframes.push(keyframe);
  keyframes.sort((a, b) => a.frame - b.frame);
  return { jointId, keyframes };
}

export function deleteKeyframe(
  tracks: AnimationTracks,
  jointId: string,
  frame: number,
): Record<string, JointTrack> {
  const track = tracks[jointId];
  if (!track?.keyframes.some((keyframe) => keyframe.frame === frame))
    return { ...tracks };
  const keyframes = track.keyframes.filter((keyframe) => keyframe.frame !== frame);
  const next = { ...tracks };
  if (keyframes.length === 0) delete next[jointId];
  else next[jointId] = { ...track, keyframes };
  return next;
}

export function moveKeyframe(
  tracks: AnimationTracks,
  jointId: string,
  sourceFrame: number,
  targetFrame: number,
  durationFrames: number,
): Record<string, JointTrack> {
  assertFrame(targetFrame, durationFrames);
  const track = tracks[jointId];
  const source = track?.keyframes.find((keyframe) => keyframe.frame === sourceFrame);
  if (!track || !source)
    throw new RangeError(`No keyframe exists at frame ${sourceFrame}.`);
  if (sourceFrame === targetFrame) return { ...tracks };
  if (track.keyframes.some((keyframe) => keyframe.frame === targetFrame))
    throw new RangeError(`A keyframe already exists at frame ${targetFrame}.`);
  const nextKeyframes = track.keyframes
    .map((keyframe) =>
      keyframe.frame === sourceFrame ? { ...keyframe, frame: targetFrame } : keyframe,
    )
    .sort((a, b) => a.frame - b.frame);
  return { ...tracks, [jointId]: { ...track, keyframes: nextKeyframes } };
}

export function findKeyframe(
  tracks: AnimationTracks,
  jointId: string,
  frame: number,
): JointKeyframe | undefined {
  return tracks[jointId]?.keyframes.find((keyframe) => keyframe.frame === frame);
}

export function maximumKeyframeFrame(tracks: AnimationTracks): number {
  let maximum = 0;
  for (const track of Object.values(tracks))
    for (const keyframe of track.keyframes) maximum = Math.max(maximum, keyframe.frame);
  return maximum;
}
