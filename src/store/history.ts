import type { RigPose } from "../core/rigs/pose";
import type { RigId } from "../core/rigs/types";
import type { AnimationTracks } from "../core/animation/keyframes";
import type { AnimationMarker } from "../core/animation/markers";

/** The editable document state captured by an undoable command. */
export interface EditorDocument {
  readonly rigId: RigId;
  readonly pose: RigPose;
  readonly tracks: AnimationTracks;
  readonly fps: number;
  readonly durationFrames: number;
  readonly loop: boolean;
  readonly markers: readonly AnimationMarker[];
}

/** One semantic edit, stored as immutable before/after document snapshots. */
export interface HistoryEntry {
  readonly label: string;
  readonly before: EditorDocument;
  readonly after: EditorDocument;
}

export interface HistoryState {
  readonly past: readonly HistoryEntry[];
  readonly future: readonly HistoryEntry[];
}

export const emptyHistory = (): HistoryState => ({ past: [], future: [] });

export function pushHistory(history: HistoryState, entry: HistoryEntry): HistoryState {
  return { past: [...history.past, entry], future: [] };
}

export function undoHistory(history: HistoryState): {
  readonly history: HistoryState;
  readonly entry: HistoryEntry | null;
} {
  const entry = history.past[history.past.length - 1] ?? null;
  if (!entry) return { history, entry: null };
  return {
    entry,
    history: {
      past: history.past.slice(0, -1),
      future: [...history.future, entry],
    },
  };
}

export function redoHistory(history: HistoryState): {
  readonly history: HistoryState;
  readonly entry: HistoryEntry | null;
} {
  const entry = history.future[history.future.length - 1] ?? null;
  if (!entry) return { history, entry: null };
  return {
    entry,
    history: {
      past: [...history.past, entry],
      future: history.future.slice(0, -1),
    },
  };
}
