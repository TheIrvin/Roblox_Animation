import { describe, expect, it } from "vitest";
import { evaluateEasing, type PoseEasingDirection, type PoseEasingStyle } from "./easing";

describe("easing", () => {
  const styles: PoseEasingStyle[] = [
    "Linear",
    "Constant",
    "Elastic",
    "Cubic",
    "Bounce",
    "CubicV2",
  ];
  const directions: PoseEasingDirection[] = ["In", "Out", "InOut"];

  it("keeps endpoints finite and maps them to 0 and 1 for every style/direction", () => {
    for (const style of styles) {
      for (const direction of directions) {
        expect(evaluateEasing(0, style, direction)).toBe(0);
        expect(evaluateEasing(1, style, direction)).toBe(1);
        expect(Number.isFinite(evaluateEasing(0.37, style, direction))).toBe(true);
      }
    }
  });

  it("implements linear, constant, and symmetric cubic behavior", () => {
    expect(evaluateEasing(0.3, "Linear", "InOut")).toBeCloseTo(0.3);
    expect(evaluateEasing(0.3, "Constant", "In")).toBe(0);
    expect(evaluateEasing(1, "Constant", "In")).toBe(1);
    expect(evaluateEasing(0.5, "CubicV2", "InOut")).toBeCloseTo(0.5);
    expect(evaluateEasing(0.25, "CubicV2", "In")).toBeCloseTo(0.015625);
  });

  it("steps Constant at deterministic direction boundaries", () => {
    expect(evaluateEasing(0.999, "Constant", "In")).toBe(0);
    expect(evaluateEasing(1, "Constant", "In")).toBe(1);

    expect(evaluateEasing(0, "Constant", "Out")).toBe(0);
    expect(evaluateEasing(Number.EPSILON, "Constant", "Out")).toBe(1);

    expect(evaluateEasing(0.4999, "Constant", "InOut")).toBe(0);
    expect(evaluateEasing(0.5, "Constant", "InOut")).toBe(1);
  });

  it("rejects NaN alpha", () => {
    expect(() => evaluateEasing(Number.NaN, "Linear", "In")).toThrow(RangeError);
  });
});
