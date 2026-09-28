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
});
