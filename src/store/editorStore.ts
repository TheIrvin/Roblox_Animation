import { createStore } from "zustand/vanilla";
import { createBindPose, type JointPose, type RigPose } from "../core/rigs/pose";
import { R6_RIG } from "../core/rigs/r6";
import { R15_RIG } from "../core/rigs/r15";
import type { RigId } from "../core/rigs/types";
import { evaluateAnimationFrame } from "../core/animation/evaluator";
import {
  findKeyframe,
  upsertKeyframe,
  type JointKeyframe,
} from "../core/animation/keyframes";
import { applyEditorCommand, commandLabel, type EditorCommand } from "./commands";
import {
  emptyHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type EditorDocument,
  type HistoryEntry,
  type HistoryState,
} from "./history";

const rigs = { R6: R6_RIG, R15: R15_RIG } as const;
const DEFAULT_FRAME = 0;
const DEFAULT_FPS = 30;
const DEFAULT_DURATION = 22;

interface Transaction {
  readonly label: string;
  readonly before: EditorDocument;
}

export interface EditorStoreState {
  readonly rigId: RigId;
  readonly pose: RigPose;
  readonly tracks: EditorDocument["tracks"];
  readonly fps: number;
  readonly durationFrames: number;
  readonly loop: boolean;
  readonly selectedJointId: string | null;
  readonly currentFrame: number;
  readonly isPlaying: boolean;
  readonly autoKey: boolean;
  readonly copiedKeyframe: JointKeyframe | null;
  readonly copiedPose: RigPose | null;
  readonly copiedJoint: { readonly jointId: string; readonly pose: JointPose } | null;
  readonly history: HistoryState;
  readonly transaction: Transaction | null;
  readonly savedDocument: EditorDocument;
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  execute: (command: EditorCommand) => void;
  selectJoint: (jointId: string | null) => void;
  setCurrentFrame: (frame: number) => void;
  setAutoKey: (enabled: boolean) => void;
  setDuration: (durationFrames: number) => void;
  setFps: (fps: number) => void;
  setLoop: (loop: boolean) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  advancePlayback: (deltaSeconds: number) => void;
  copyPose: () => void;
  pastePose: () => void;
  copyJoint: (jointId: string) => void;
  pasteJoint: (jointId: string) => void;
  copyKeyframe: (jointId: string, frame: number) => void;
  beginTransformTransaction: (jointId: string) => void;
  updateTransform: (
    command: Extract<
      EditorCommand,
      { type: "set-joint-rotation" | "set-joint-position" }
    >,
  ) => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
}

function snapshotDocument(document: EditorDocument): EditorDocument {
  return {
    rigId: document.rigId,
    pose: Object.fromEntries(
      Object.entries(document.pose).map(([jointId, jointPose]) => [
        jointId,
        {
          position: [...jointPose.position],
          rotation: [...jointPose.rotation],
        },
      ]),
    ),
    tracks: Object.fromEntries(
      Object.entries(document.tracks).map(([jointId, track]) => [
        jointId,
        {
          jointId: track.jointId,
          keyframes: track.keyframes.map((keyframe) => ({
            frame: keyframe.frame,
            transform: {
              position: [...keyframe.transform.position],
              rotation: [...keyframe.transform.rotation],
            },
            easing: { ...keyframe.easing },
          })),
        },
      ]),
    ),
    fps: document.fps,
    durationFrames: document.durationFrames,
    loop: document.loop,
  };
}

function documentsEqual(left: EditorDocument, right: EditorDocument): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function documentFromState(
  state: Pick<
    EditorStoreState,
    "rigId" | "pose" | "tracks" | "fps" | "durationFrames" | "loop"
  >,
): EditorDocument {
  return {
    rigId: state.rigId,
    pose: state.pose,
    tracks: state.tracks,
    fps: state.fps,
    durationFrames: state.durationFrames,
    loop: state.loop,
  };
}

function stateForDocument(document: EditorDocument) {
  return {
    rigId: document.rigId,
    pose: document.pose,
    tracks: document.tracks,
    fps: document.fps,
    durationFrames: document.durationFrames,
    loop: document.loop,
  };
}

function applyAutoKey(
  document: EditorDocument,
  command: EditorCommand,
  currentFrame: number,
  enabled: boolean,
): EditorDocument {
  if (!enabled) return document;
  const jointIds =
    command.type === "set-joint-rotation" ||
    command.type === "set-joint-position" ||
    command.type === "reset-joint"
      ? [command.jointId]
      : command.type === "reset-pose"
        ? rigs[document.rigId].joints.map((joint) => joint.id)
        : command.type === "paste-pose" || command.type === "mirror-pose"
          ? rigs[document.rigId].joints.map((joint) => joint.id)
          : command.type === "paste-joint"
            ? [command.jointId]
            : [];
  if (jointIds.length === 0) return document;
  const tracks = { ...document.tracks };
  for (const jointId of jointIds)
    tracks[jointId] = upsertKeyframe(
      tracks[jointId],
      jointId,
      Math.round(currentFrame),
      document.pose[jointId],
      document.durationFrames,
    );
  return { ...document, tracks };
}

function stateWithDocument(
  state: EditorStoreState,
  document: EditorDocument,
  history: HistoryState,
  transaction: Transaction | null = null,
  previewFrame = state.currentFrame,
) {
  const selectedJointExists = rigs[document.rigId].joints.some(
    (joint) => joint.id === state.selectedJointId,
  );
  const savedFramePose =
    state.savedDocument.rigId === document.rigId
      ? evaluateAnimationFrame(
          state.savedDocument.tracks,
          state.savedDocument.pose,
          previewFrame,
        )
      : state.savedDocument.pose;
  const isSavedFramePreview =
    state.savedDocument.rigId === document.rigId &&
    JSON.stringify(document.pose) === JSON.stringify(savedFramePose);
  const dirtyComparisonDocument = isSavedFramePreview
    ? { ...document, pose: state.savedDocument.pose }
    : document;
  return {
    ...state,
    ...stateForDocument(document),
    history,
    transaction,
    selectedJointId: selectedJointExists
      ? state.selectedJointId
      : rigs[document.rigId].rootId,
    isDirty: !documentsEqual(dirtyComparisonDocument, state.savedDocument),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

export function createEditorStore(initialRigId: RigId = "R15") {
  const initialDocument = snapshotDocument({
    rigId: initialRigId,
    pose: createBindPose(rigs[initialRigId]),
    tracks: {},
    fps: DEFAULT_FPS,
    durationFrames: DEFAULT_DURATION,
    loop: false,
  });

  return createStore<EditorStoreState>()((set, get) => ({
    ...initialDocument,
    selectedJointId: rigs[initialRigId].rootId,
    currentFrame: DEFAULT_FRAME,
    isPlaying: false,
    autoKey: true,
    copiedKeyframe: null,
    copiedPose: null,
    copiedJoint: null,
    history: emptyHistory(),
    transaction: null,
    savedDocument: initialDocument,
    isDirty: false,
    canUndo: false,
    canRedo: false,

    execute(command) {
      const current = get();
      const currentDocument = documentFromState(current);
      const before = current.transaction?.before ?? snapshotDocument(currentDocument);
      const uncommitted = applyAutoKey(
        applyEditorCommand(currentDocument, command),
        command,
        current.currentFrame,
        current.autoKey,
      );
      const after = snapshotDocument(uncommitted);
      const history = current.history;
      const entry: HistoryEntry = {
        label: current.transaction?.label ?? commandLabel(command),
        before,
        after,
      };
      if (documentsEqual(before, after)) {
        if (current.transaction) set({ transaction: null });
        return;
      }
      const nextHistory = pushHistory(history, entry);
      set((state) => ({
        ...stateWithDocument(state, after, nextHistory, null),
        selectedJointId:
          command.type === "change-rig"
            ? rigs[command.rigId].rootId
            : state.selectedJointId,
      }));
    },

    selectJoint(jointId) {
      const state = get();
      if (
        jointId !== null &&
        !rigs[state.rigId].joints.some((joint) => joint.id === jointId)
      )
        throw new RangeError(`Unknown joint ${jointId} for ${state.rigId}.`);
      set({ selectedJointId: jointId });
    },

    setCurrentFrame(frame) {
      if (!Number.isSafeInteger(frame) || frame < 0 || frame > get().durationFrames)
        throw new RangeError("Current frame must be within the animation duration.");
      const state = get();
      const pose = evaluateAnimationFrame(
        state.tracks,
        state.isDirty ? state.pose : state.savedDocument.pose,
        frame,
      );
      set({ pose, currentFrame: frame });
    },

    setAutoKey(enabled) {
      set({ autoKey: enabled });
    },

    setDuration(durationFrames) {
      if (durationFrames < get().currentFrame)
        throw new RangeError("Duration cannot be shorter than the current frame.");
      get().execute({ type: "set-duration", durationFrames });
    },

    setFps(fps) {
      get().execute({ type: "set-fps", fps });
    },

    setLoop(loop) {
      get().execute({ type: "set-loop", loop });
    },

    play() {
      set({ isPlaying: true });
    },

    pause() {
      set({ isPlaying: false });
    },

    stop() {
      const state = get();
      const pose = evaluateAnimationFrame(
        state.tracks,
        state.isDirty ? state.pose : state.savedDocument.pose,
        0,
      );
      set({ isPlaying: false, currentFrame: 0, pose });
    },

    advancePlayback(deltaSeconds) {
      if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
        throw new RangeError("Playback delta must be a finite non-negative duration.");
      const state = get();
      if (!state.isPlaying || deltaSeconds === 0) return;
      let nextFrame = state.currentFrame + deltaSeconds * state.fps;
      let isPlaying = true;
      if (nextFrame >= state.durationFrames) {
        if (state.loop) nextFrame %= state.durationFrames;
        else {
          nextFrame = state.durationFrames;
          isPlaying = false;
        }
      }
      const pose = evaluateAnimationFrame(
        state.tracks,
        state.isDirty ? state.pose : state.savedDocument.pose,
        nextFrame,
      );
      set({ currentFrame: nextFrame, pose, isPlaying });
    },

    copyPose() {
      const state = get();
      const copiedPose = Object.fromEntries(
        Object.entries(state.pose).map(([jointId, pose]) => [
          jointId,
          { position: [...pose.position], rotation: [...pose.rotation] },
        ]),
      ) as RigPose;
      set({ copiedPose });
    },

    pastePose() {
      const copiedPose = get().copiedPose;
      if (copiedPose) get().execute({ type: "paste-pose", pose: copiedPose });
    },

    copyJoint(jointId) {
      const state = get();
      if (!rigs[state.rigId].joints.some((joint) => joint.id === jointId))
        throw new RangeError(`Unknown joint ${jointId} for ${state.rigId}.`);
      const pose = state.pose[jointId];
      set({
        copiedJoint: {
          jointId,
          pose: { position: [...pose.position], rotation: [...pose.rotation] },
        },
      });
    },

    pasteJoint(jointId) {
      const copiedJoint = get().copiedJoint;
      if (copiedJoint)
        get().execute({ type: "paste-joint", jointId, pose: copiedJoint.pose });
    },

    copyKeyframe(jointId, frame) {
      const keyframe = findKeyframe(get().tracks, jointId, frame);
      if (!keyframe) throw new RangeError(`No keyframe exists at frame ${frame}.`);
      set({
        copiedKeyframe: {
          ...keyframe,
          transform: {
            position: [...keyframe.transform.position],
            rotation: [...keyframe.transform.rotation],
          },
          easing: { ...keyframe.easing },
        },
      });
    },

    beginTransformTransaction(jointId) {
      const state = get();
      if (!rigs[state.rigId].joints.some((joint) => joint.id === jointId))
        throw new RangeError(`Unknown joint ${jointId} for ${state.rigId}.`);
      if (state.transaction) return;
      set({
        transaction: {
          label: `Transform ${jointId}`,
          before: snapshotDocument(documentFromState(state)),
        },
      });
    },

    updateTransform(command) {
      const state = get();
      if (!state.transaction) {
        get().execute(command);
        return;
      }
      const updated = applyAutoKey(
        applyEditorCommand(documentFromState(state), command),
        command,
        state.currentFrame,
        state.autoKey,
      );
      set((current) => ({
        ...stateWithDocument(
          current,
          snapshotDocument(updated),
          current.history,
          current.transaction,
        ),
      }));
    },

    commitTransaction() {
      const state = get();
      if (!state.transaction) return;
      const before = state.transaction.before;
      const after = snapshotDocument(documentFromState(state));
      if (documentsEqual(before, after)) {
        set({ transaction: null });
        return;
      }
      const nextHistory = pushHistory(state.history, {
        label: state.transaction.label,
        before,
        after,
      });
      set((current) => stateWithDocument(current, after, nextHistory));
    },

    cancelTransaction() {
      const state = get();
      if (!state.transaction) return;
      const restored = state.transaction.before;
      set((current) => stateWithDocument(current, restored, current.history));
    },

    undo() {
      get().commitTransaction();
      const state = get();
      const result = undoHistory(state.history);
      if (!result.entry) return;
      set((current) => stateWithDocument(current, result.entry!.before, result.history));
    },

    redo() {
      get().commitTransaction();
      const state = get();
      const result = redoHistory(state.history);
      if (!result.entry) return;
      set((current) => stateWithDocument(current, result.entry!.after, result.history));
    },

    markSaved() {
      const state = get();
      const savedDocument = snapshotDocument(documentFromState(state));
      set({ savedDocument, isDirty: false });
    },
  }));
}

export const editorStore = createEditorStore();
