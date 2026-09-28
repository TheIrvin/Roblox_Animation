import { evaluateEasing } from "./easing";
import type { AnimationTracks } from "./keyframes";
import { interpolateTransform } from "./interpolation";
import type { RigPose } from "../rigs/pose";

/** Evaluates independent sparse joint tracks at a fractional frame position. */
export function evaluateAnimationFrame(
  tracks: AnimationTracks,
  basePose: RigPose,
  frame: number,
): RigPose {
  if (!Number.isFinite(frame) || frame < 0)
    throw new RangeError("Animation frame must be a finite non-negative number.");

  const pose = { ...basePose };
  for (const [jointId, track] of Object.entries(tracks)) {
    const keyframes = track.keyframes;
    if (keyframes.length === 0) continue;

    const exactKeyframe = keyframes.find((keyframe) => keyframe.frame === frame);
    if (exactKeyframe) {
      pose[jointId] = exactKeyframe.transform;
      continue;
    }

    const rightIndex = keyframes.findIndex((keyframe) => keyframe.frame >= frame);
    if (rightIndex === 0) {
      pose[jointId] = keyframes[0].transform;
      continue;
    }
    if (rightIndex < 0) {
      pose[jointId] = keyframes[keyframes.length - 1].transform;
      continue;
    }

    const left = keyframes[rightIndex - 1];
    const right = keyframes[rightIndex];
    const alpha = (frame - left.frame) / (right.frame - left.frame);
    const easedAlpha = evaluateEasing(alpha, left.easing.style, left.easing.direction);
    pose[jointId] = interpolateTransform(left.transform, right.transform, easedAlpha);
  }
  return pose;
}
