import { createStore } from "zustand/vanilla";
import { createBindPose, type RigPose } from "../core/rigs/pose";
import { R6_RIG } from "../core/rigs/r6";
import { R15_RIG } from "../core/rigs/r15";
import type { RigId } from "../core/rigs/types";
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

interface Transaction {
  readonly label: string;
  readonly before: EditorDocument;
}

export interface EditorStoreState {
  readonly rigId: RigId;
  readonly pose: RigPose;
  readonly selectedJointId: string | null;
  readonly currentFrame: number;
  readonly history: HistoryState;
  readonly transaction: Transaction | null;
  readonly savedDocument: EditorDocument;
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  execute: (command: EditorCommand) => void;
  selectJoint: (jointId: string | null) => void;
  setCurrentFrame: (frame: number) => void;
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
  };
}

function documentsEqual(left: EditorDocument, right: EditorDocument): boolean {
  if (left.rigId !== right.rigId) return false;
  const leftIds = Object.keys(left.pose);
  const rightIds = Object.keys(right.pose);
  if (leftIds.length !== rightIds.length) return false;
  return leftIds.every((id) => {
    const a = left.pose[id];
    const b = right.pose[id];
    return (
      !!b &&
      a.position.every((value, index) => Object.is(value, b.position[index])) &&
      a.rotation.every((value, index) => Object.is(value, b.rotation[index]))
    );
  });
}

function documentFromState(
  state: Pick<EditorStoreState, "rigId" | "pose">,
): EditorDocument {
  return { rigId: state.rigId, pose: state.pose };
}

function stateForDocument(document: EditorDocument) {
  return { rigId: document.rigId, pose: document.pose };
}

function stateWithDocument(
  state: EditorStoreState,
  document: EditorDocument,
  history: HistoryState,
  transaction: Transaction | null = null,
) {
  const selectedJointExists = rigs[document.rigId].joints.some(
    (joint) => joint.id === state.selectedJointId,
  );
  return {
    ...state,
    ...stateForDocument(document),
    history,
    transaction,
    selectedJointId: selectedJointExists
      ? state.selectedJointId
      : rigs[document.rigId].rootId,
    isDirty: !documentsEqual(document, state.savedDocument),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

export function createEditorStore(initialRigId: RigId = "R15") {
  const initialDocument = snapshotDocument({
    rigId: initialRigId,
    pose: createBindPose(rigs[initialRigId]),
  });

  return createStore<EditorStoreState>()((set, get) => ({
    ...initialDocument,
    selectedJointId: rigs[initialRigId].rootId,
    currentFrame: DEFAULT_FRAME,
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
      const uncommitted = applyEditorCommand(currentDocument, command);
      const after = snapshotDocument(uncommitted);
      const history = current.transaction ? current.history : current.history;
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
      if (!Number.isSafeInteger(frame) || frame < 0)
        throw new RangeError("Current frame must be a non-negative integer.");
      set({ currentFrame: frame });
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
      const updated = applyEditorCommand(documentFromState(state), command);
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
