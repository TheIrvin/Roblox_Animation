import { describe, expect, it } from "vitest";
import { quaternionFromEulerXYZ } from "../core/math/quaternion";
import { createEditorStore } from "./editorStore";
import { parseRbanimProjectV1 } from "../core/project/rbanim";

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

  it("plays in real time, pauses, stops, and wraps when looping", () => {
    const store = createEditorStore();
    store.getState().setAutoKey(false);
    store.getState().execute({
      type: "add-keyframe",
      jointId: "HumanoidRootPart",
      frame: 0,
    });
    store.getState().execute({
      type: "set-joint-position",
      jointId: "HumanoidRootPart",
      position: [22, 0, 0],
    });
    store.getState().execute({
      type: "add-keyframe",
      jointId: "HumanoidRootPart",
      frame: 22,
    });
    store.getState().markSaved();

    store.getState().play();
    store.getState().advancePlayback(0.5);
    expect(store.getState().currentFrame).toBe(15);
    expect(store.getState().pose.HumanoidRootPart.position[0]).toBeGreaterThan(15);
    expect(store.getState().pose.HumanoidRootPart.position[0]).toBeLessThan(22);
    store.getState().pause();
    expect(store.getState().isPlaying).toBe(false);

    store.getState().setLoop(true);
    store.getState().play();
    store.getState().advancePlayback(0.5);
    expect(store.getState().currentFrame).toBe(8);
    expect(store.getState().isPlaying).toBe(true);
    store.getState().stop();
    expect(store.getState().currentFrame).toBe(0);
    expect(store.getState().isPlaying).toBe(false);
    expect(() => store.getState().advancePlayback(-0.1)).toThrow(RangeError);
  });

  it("stops at the duration when playback is not looping", () => {
    const store = createEditorStore();
    store.getState().setCurrentFrame(5);
    store.getState().play();
    store.getState().advancePlayback(0.1);
    expect(store.getState().currentFrame).toBe(8);
    store.getState().pause();
    expect(store.getState().currentFrame).toBe(8);
    store.getState().play();
    store.getState().advancePlayback(2);
    expect(store.getState().currentFrame).toBe(store.getState().durationFrames);
    expect(store.getState().isPlaying).toBe(false);
  });

  it("copies and pastes full poses and joints as undoable commands", () => {
    const store = createEditorStore();
    store.getState().setAutoKey(false);
    store.getState().execute({
      type: "set-joint-position",
      jointId: "HumanoidRootPart",
      position: [2, 0, -1],
    });
    const sourceRotation = quaternionFromEulerXYZ([0.3, -0.2, 0.1]);
    store.getState().execute({
      type: "set-joint-rotation",
      jointId: "Head",
      rotation: sourceRotation,
    });
    const sourcePose = store.getState().pose;
    store.getState().copyPose();
    store.getState().execute({ type: "reset-pose" });
    expect(store.getState().pose.HumanoidRootPart.position).toEqual([0, 0, 0]);
    store.getState().undo();
    expect(store.getState().pose).toEqual(sourcePose);
    store.getState().redo();
    expect(store.getState().pose.Head.rotation).toEqual([0, 0, 0, 1]);
    store.getState().pastePose();
    expect(store.getState().pose).toEqual(sourcePose);
    store.getState().undo();
    expect(store.getState().pose.HumanoidRootPart.position).toEqual([0, 0, 0]);
    store.getState().redo();
    expect(store.getState().pose).toEqual(sourcePose);

    store.getState().copyJoint("Head");
    store.getState().execute({ type: "reset-joint", jointId: "Head" });
    store.getState().pasteJoint("RightUpperArm");
    store
      .getState()
      .pose.RightUpperArm.rotation.forEach((component, index) =>
        expect(component).toBeCloseTo(sourceRotation[index], 6),
      );
    store.getState().undo();
    expect(store.getState().pose.RightUpperArm.rotation).toEqual([0, 0, 0, 1]);
  });

  it.each(["R6", "R15"] as const)("mirrors %s poses and supports undo/redo", (rigId) => {
    const store = createEditorStore(rigId);
    store.getState().setAutoKey(false);
    const leftJoint = rigId === "R6" ? "Left Arm" : "LeftUpperArm";
    const rightJoint = rigId === "R6" ? "Right Arm" : "RightUpperArm";
    const leftRotation = quaternionFromEulerXYZ([0.6, -0.2, 0.1]);
    store.getState().execute({
      type: "set-joint-rotation",
      jointId: leftJoint,
      rotation: leftRotation,
    });
    const beforeMirror = store.getState().pose;
    store.getState().execute({ type: "mirror-pose" });
    expect(store.getState().pose[rightJoint].rotation).not.toEqual(leftRotation);
    store.getState().undo();
    expect(store.getState().pose).toEqual(beforeMirror);
    store.getState().redo();
    expect(store.getState().pose[rightJoint].rotation).not.toEqual([0, 0, 0, 1]);
  });

  it("creates the ThrowRock marker, edits it, and preserves marker history", () => {
    const store = createEditorStore();
    const markerId = store.getState().addMarker("THROW", 16);
    expect(store.getState().markers).toEqual([
      { id: markerId, frame: 16, name: "THROW" },
    ]);
    store.getState().markSaved();
    expect(JSON.parse(JSON.stringify(store.getState().savedDocument.markers))).toEqual([
      { id: markerId, frame: 16, name: "THROW" },
    ]);
    store.getState().selectMarker(markerId);
    expect(store.getState().currentFrame).toBe(16);
    expect(() => store.getState().setDuration(15)).toThrow(RangeError);

    store.getState().execute({
      type: "rename-marker",
      markerId,
      name: "RELEASE",
    });
    store.getState().execute({ type: "move-marker", markerId, frame: 18 });
    expect(store.getState().markers[0]).toMatchObject({
      id: markerId,
      frame: 18,
      name: "RELEASE",
    });
    store.getState().execute({ type: "delete-marker", markerId });
    expect(store.getState().markers).toEqual([]);
    store.getState().undo();
    expect(store.getState().markers[0].frame).toBe(18);
    store.getState().redo();
    expect(store.getState().markers).toEqual([]);
  });

  it("loads a validated project, keeps its marker, and creates a clean new project", () => {
    const project = parseRbanimProjectV1(
      JSON.stringify({
        schemaVersion: 1,
        app: { name: "Roblox Animator Desktop", createdWith: "0.1.0" },
        project: {
          id: "saved-project",
          name: "ThrowRock",
          rig: "R6",
          fps: 30,
          durationFrames: 22,
          loop: false,
          priority: "Action",
        },
        tracks: {},
        markers: [{ id: "throw", frame: 16, name: "THROW" }],
      }),
    );
    const store = createEditorStore();
    store.getState().loadProject(project, "throw-rock.rbanim");
    expect(store.getState().projectName).toBe("ThrowRock");
    expect(store.getState().rigId).toBe("R6");
    expect(store.getState().filePath).toBe("throw-rock.rbanim");
    expect(store.getState().markers).toEqual(project.markers);
    expect(store.getState().isDirty).toBe(false);
    store.getState().selectMarker("throw");
    expect(store.getState().currentFrame).toBe(16);

    store.getState().renameProject("A different name");
    expect(store.getState().isDirty).toBe(true);
    store.getState().undo();
    expect(store.getState().projectName).toBe("ThrowRock");
    expect(store.getState().isDirty).toBe(false);
    store.getState().newProject("R15");
    expect(store.getState().projectName).toBe("Untitled");
    expect(store.getState().rigId).toBe("R15");
    expect(store.getState().filePath).toBeNull();
    expect(store.getState().markers).toEqual([]);
    expect(store.getState().isDirty).toBe(false);
  });
});
