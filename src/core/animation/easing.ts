export type PoseEasingStyle =
  "Linear" | "Constant" | "Elastic" | "Cubic" | "Bounce" | "CubicV2";

export type PoseEasingDirection = "In" | "Out" | "InOut";

function cubicIn(t: number): number {
  return t * t * t;
}

function bounceOut(t: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) {
    const shifted = t - 1.5 / d;
    return n * shifted * shifted + 0.75;
  }
  if (t < 2.5 / d) {
    const shifted = t - 2.25 / d;
    return n * shifted * shifted + 0.9375;
  }
  const shifted = t - 2.625 / d;
  return n * shifted * shifted + 0.984375;
}

function easeIn(style: PoseEasingStyle, t: number): number {
  switch (style) {
    case "Linear":
    case "Cubic":
    case "CubicV2":
      return style === "Linear" ? t : cubicIn(t);
    case "Constant":
      return t < 1 ? 0 : 1;
    case "Elastic":
      return t === 0 || t === 1
        ? t
        : -Math.pow(2, 10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3);
    case "Bounce":
      return 1 - bounceOut(1 - t);
  }
}

/** Evaluate Roblox-style easing over a normalized [0, 1] interval. */
export function evaluateEasing(
  alpha: number,
  style: PoseEasingStyle,
  direction: PoseEasingDirection,
): number {
  if (!Number.isFinite(alpha)) throw new RangeError("Easing alpha must be finite.");
  const t = Math.min(1, Math.max(0, alpha));
  if (style === "Constant") {
    switch (direction) {
      case "In":
        return t < 1 ? 0 : 1;
      case "Out":
        return t <= 0 ? 0 : 1;
      case "InOut":
        return t < 0.5 ? 0 : 1;
    }
  }
  if (style === "Linear") return t;

  switch (direction) {
    case "In":
      return easeIn(style, t);
    case "Out":
      return 1 - easeIn(style, 1 - t);
    case "InOut":
      return t < 0.5 ? easeIn(style, t * 2) / 2 : 1 - easeIn(style, (1 - t) * 2) / 2;
  }
}
