import { describe, expect, it } from "vitest";
import { quaternionFromEulerXYZ } from "../core/math/quaternion";
import { createEditorStore } from "./editorStore";

describe("editor store commands and history", () => {
  it("undoes and redoes a joint transform as one semantic command", () => {
    const store = createEditorStore();
    const rotation = quaternionFromEulerXYZ([0.4, -0.2, 0.1]);

    store.getState().execute({
      type: "set-joint-rotation",
      jointId: "RightUpperArm",
      rotation,
    });

    expect(store.getState().pose.RightUpperArm.rotation).toEqual(rotation);
    expect(store.getState().isDirty).toBe(true);
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual([0, 0, 0, 1]);
    expect(store.getState().isDirty).toBe(false);
    expect(store.getState().canRedo).toBe(true);

    store.getState().redo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual(rotation);
    expect(store.getState().isDirty).toBe(true);
  });

  it("resets one joint and allows reset itself to be undone", () => {
    const store = createEditorStore();
    const rotation = quaternionFromEulerXYZ([0, 0.75, 0]);
    store.getState().execute({
      type: "set-joint-rotation",
      jointId: "RightUpperArm",
      rotation,
    });
    store.getState().execute({ type: "reset-joint", jointId: "RightUpperArm" });

    expect(store.getState().pose.RightUpperArm.rotation).toEqual([0, 0, 0, 1]);
    store.getState().undo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual(rotation);
    store.getState().undo();
    expect(store.getState().isDirty).toBe(false);
  });

  it("keeps selection and current frame outside project dirty state", () => {
    const store = createEditorStore();
    store.getState().selectJoint("RightHand");
    store.getState().setCurrentFrame(16);

    expect(store.getState().selectedJointId).toBe("RightHand");
    expect(store.getState().currentFrame).toBe(16);
    expect(store.getState().isDirty).toBe(false);
    expect(() => store.getState().setCurrentFrame(-1)).toThrow(RangeError);
    expect(() => store.getState().setCurrentFrame(1.5)).toThrow(RangeError);
    expect(() => store.getState().selectJoint("Left Arm")).toThrow(RangeError);
  });

  it("tracks dirty state against the last saved document", () => {
    const store = createEditorStore();
    store.getState().execute({
      type: "set-joint-position",
      jointId: "HumanoidRootPart",
      position: [1, 0, 0],
    });
    store.getState().markSaved();
    expect(store.getState().isDirty).toBe(false);

    store.getState().execute({ type: "reset-joint", jointId: "HumanoidRootPart" });
    expect(store.getState().isDirty).toBe(true);
    store.getState().undo();
    expect(store.getState().isDirty).toBe(false);
  });

  it("records a multi-update viewport drag as one undo entry", () => {
    const store = createEditorStore();
    const halfway = quaternionFromEulerXYZ([0.2, 0, 0]);
    const finalRotation = quaternionFromEulerXYZ([0.6, -0.1, 0.2]);

    store.getState().beginTransformTransaction("RightUpperArm");
    store.getState().updateTransform({
      type: "set-joint-rotation",
      jointId: "RightUpperArm",
      rotation: halfway,
    });
    store.getState().updateTransform({
      type: "set-joint-rotation",
      jointId: "RightUpperArm",
      rotation: finalRotation,
    });
    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().isDirty).toBe(true);

    store.getState().commitTransaction();
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual([0, 0, 0, 1]);
    expect(store.getState().isDirty).toBe(false);
    store.getState().redo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual(finalRotation);
  });

  it("auto keys edits at the current frame and updates duplicate frames", () => {
    const store = createEditorStore();
    const first = quaternionFromEulerXYZ([0.2, 0, 0]);
    const updated = quaternionFromEulerXYZ([0.5, 0.1, 0]);
    store.getState().setCurrentFrame(4);
    store
      .getState()
      .execute({ type: "set-joint-rotation", jointId: "RightUpperArm", rotation: first });
    store.getState().execute({
      type: "set-joint-rotation",
      jointId: "RightUpperArm",
      rotation: updated,
    });
    expect(store.getState().tracks.RightUpperArm.keyframes).toHaveLength(1);
    expect(store.getState().tracks.RightUpperArm.keyframes[0].frame).toBe(4);
    expect(store.getState().tracks.RightUpperArm.keyframes[0].transform.rotation).toEqual(
      updated,
    );
  });

  it("keeps edits unkeyed with Auto Key off until Add Keyframe", () => {
    const store = createEditorStore();
    store.getState().setAutoKey(false);
    store.getState().setCurrentFrame(3);
    const rotation = quaternionFromEulerXYZ([0, 0.6, 0]);
    store
      .getState()
      .execute({ type: "set-joint-rotation", jointId: "RightHand", rotation });
    expect(store.getState().tracks.RightHand).toBeUndefined();
    store.getState().execute({ type: "add-keyframe", jointId: "RightHand", frame: 3 });
    expect(store.getState().tracks.RightHand.keyframes[0].transform.rotation).toEqual(
      rotation,
    );
  });

  it("adds, moves, deletes, copies and pastes keyframes with undo history", () => {
    const store = createEditorStore();
    store.getState().setAutoKey(false);
    store.getState().execute({
      type: "set-joint-position",
      jointId: "HumanoidRootPart",
      position: [1, 0, 0],
    });
    store
      .getState()
      .execute({ type: "add-keyframe", jointId: "HumanoidRootPart", frame: 2 });
    store.getState().execute({
      type: "move-keyframe",
      jointId: "HumanoidRootPart",
      sourceFrame: 2,
      targetFrame: 5,
    });
    expect(
      store.getState().tracks.HumanoidRootPart.keyframes.map(({ frame }) => frame),
    ).toEqual([5]);
    store.getState().copyKeyframe("HumanoidRootPart", 5);
    store.getState().execute({
      type: "paste-keyframe",
      jointId: "HumanoidRootPart",
      frame: 8,
      keyframe: store.getState().copiedKeyframe!,
    });
    expect(
      store.getState().tracks.HumanoidRootPart.keyframes.map(({ frame }) => frame),
    ).toEqual([5, 8]);
    store
      .getState()
      .execute({ type: "delete-keyframe", jointId: "HumanoidRootPart", frame: 5 });
    expect(
      store.getState().tracks.HumanoidRootPart.keyframes.map(({ frame }) => frame),
    ).toEqual([8]);
    store.getState().undo();
    expect(
      store.getState().tracks.HumanoidRootPart.keyframes.map(({ frame }) => frame),
    ).toEqual([5, 8]);
    store.getState().redo();
    expect(
      store.getState().tracks.HumanoidRootPart.keyframes.map(({ frame }) => frame),
    ).toEqual([8]);
  });

  it("guards FPS, duration, frame bounds and keyframe move collisions", () => {
    const store = createEditorStore();
    store.getState().execute({ type: "add-keyframe", jointId: "RightHand", frame: 4 });
    store.getState().execute({ type: "add-keyframe", jointId: "RightHand", frame: 8 });
    expect(() =>
      store.getState().execute({
        type: "move-keyframe",
        jointId: "RightHand",
        sourceFrame: 4,
        targetFrame: 8,
      }),
    ).toThrow(RangeError);
    expect(() => store.getState().setDuration(7)).toThrow(RangeError);
    store.getState().setDuration(30);
    expect(store.getState().durationFrames).toBe(30);
    store.getState().setFps(60);
    expect(store.getState().fps).toBe(60);
    expect(() => store.getState().setFps(241)).toThrow(RangeError);
    expect(() => store.getState().setCurrentFrame(31)).toThrow(RangeError);
  });

  it("creates and scrubs a simple three-pose animation", () => {
    const store = createEditorStore();
    store.getState().setAutoKey(false);
    const frames = [0, 8, 16];
    const rotations = [0, Math.PI / 3, -Math.PI / 4].map((angle) =>
      quaternionFromEulerXYZ([angle, 0, 0]),
    );
    frames.forEach((frame, index) => {
      store.getState().setCurrentFrame(frame);
      store.getState().execute({
        type: "set-joint-rotation",
        jointId: "RightUpperArm",
        rotation: rotations[index],
      });
      store.getState().execute({
        type: "add-keyframe",
        jointId: "RightUpperArm",
        frame,
      });
    });
    expect(
      store.getState().tracks.RightUpperArm.keyframes.map(({ frame }) => frame),
    ).toEqual(frames);
    store.getState().markSaved();
    store.getState().setCurrentFrame(8);
    expect(store.getState().pose.RightUpperArm.rotation).toEqual(rotations[1]);
    expect(store.getState().isDirty).toBe(false);
    store.getState().setCurrentFrame(16);
    expect(store.getState().pose.RightUpperArm.rotation).toEqual(rotations[2]);
    expect(store.getState().isDirty).toBe(false);
  });
});
