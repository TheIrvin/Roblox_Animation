import { describe, expect, it } from "vitest";
import r6Fixture from "./fixtures/throw-rock-r6.json";
import r15Fixture from "./fixtures/throw-rock-r15.json";
import { normalizeProjectForExport, type ExportEnvelopeV1 } from "./normalizer";
import type { RbanimProjectV1 } from "../project/rbanim";

const exportMetadata = {
  exportId: "fixture-export-v1",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function fixture(project: unknown): RbanimProjectV1 {
  return project as RbanimProjectV1;
}

function expectNormalizedFixture(
  project: RbanimProjectV1,
  expectedTrackIds: string[],
  staticJointIds: string[],
): ExportEnvelopeV1 {
  const result = normalizeProjectForExport(project, exportMetadata);
  expect(result.diagnostics).toEqual([]);
  expect(result.envelope).not.toBeNull();
  const envelope = result.envelope!;

  expect(envelope.frames.map(({ frame }) => frame)).toEqual([
    0, 5, 9, 13, 16, 19, 21, 22,
  ]);
  expect(envelope.frames.map(({ timeSeconds }) => timeSeconds)).toEqual([
    0,
    5 / 30,
    9 / 30,
    13 / 30,
    16 / 30,
    19 / 30,
    21 / 30,
    22 / 30,
  ]);
  expect(Object.keys(project.tracks).sort()).toEqual([...expectedTrackIds].sort());
  expect(
    envelope.frames.every(
      ({ poses }) => poses.length === (project.project.rig === "R6" ? 7 : 16),
    ),
  ).toBe(true);
  for (const { poses } of envelope.frames) {
    for (const jointId of staticJointIds) {
      const pose = poses.find((candidate) => candidate.jointId === jointId);
      expect(pose?.position).toEqual([0, 0, 0]);
      expect(pose?.rotation).toEqual([0, 0, 0, 1]);
    }
  }
  expect(envelope.frames.find(({ frame }) => frame === 16)?.markers).toEqual([
    {
      id: project.project.rig === "R6" ? "throw-r6" : "throw-r15",
      frame: 16,
      name: "THROW",
      value: "rock",
    },
  ]);
  expect(envelope.project.project).toEqual(project.project);
  expect(envelope.project.markers).toEqual(project.markers);
  expect(Object.keys(envelope.project.tracks).sort()).toEqual(
    Object.keys(project.tracks).sort(),
  );
  return envelope;
}

describe("Phase 10 export normalizer", () => {
  it("normalizes the ThrowRock R15 fixture into a stable full-pose envelope", () => {
    const project = fixture(r15Fixture);
    const envelope = expectNormalizedFixture(
      project,
      [
        "UpperTorso",
        "Head",
        "LeftUpperArm",
        "LeftLowerArm",
        "RightUpperArm",
        "RightLowerArm",
        "RightHand",
      ],
      [
        "HumanoidRootPart",
        "LowerTorso",
        "LeftUpperLeg",
        "LeftLowerLeg",
        "LeftFoot",
        "RightUpperLeg",
        "RightLowerLeg",
        "RightFoot",
      ],
    );
    expect(normalizeProjectForExport(project, exportMetadata).envelope).toEqual(envelope);
    expect(
      envelope.frames
        .find(({ frame }) => frame === 16)
        ?.poses.find(({ jointId }) => jointId === "RightUpperArm")?.rotation,
    ).not.toEqual([0, 0, 0, 1]);
  });

  it("normalizes the ThrowRock R6 fixture into a stable full-pose envelope", () => {
    const project = fixture(r6Fixture);
    const envelope = expectNormalizedFixture(
      project,
      ["Head", "Left Arm", "Right Arm"],
      ["HumanoidRootPart", "Left Leg", "Right Leg"],
    );
    expect(normalizeProjectForExport(project, exportMetadata).envelope).toEqual(envelope);
    expect(
      envelope.frames
        .find(({ frame }) => frame === 16)
        ?.poses.find(({ jointId }) => jointId === "Right Arm")?.rotation,
    ).not.toEqual([0, 0, 0, 1]);
  });

  it("reports invalid project data and invalid envelope metadata", () => {
    const invalidProject = {
      ...r15Fixture,
      project: { ...r15Fixture.project, fps: 0 },
    } as unknown as RbanimProjectV1;
    expect(normalizeProjectForExport(invalidProject, exportMetadata)).toMatchObject({
      envelope: null,
      diagnostics: [{ severity: "error", code: "INVALID_PROJECT" }],
    });

    expect(
      normalizeProjectForExport(fixture(r15Fixture), {
        exportId: " ",
        createdAt: "not-a-date",
      }),
    ).toMatchObject({
      envelope: null,
      diagnostics: [
        { severity: "error", code: "INVALID_EXPORT_ID" },
        { severity: "error", code: "INVALID_CREATED_AT" },
      ],
    });
  });
});
