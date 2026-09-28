# Phase 9 Handoff

## Status
READY_FOR_REVIEW

## Scope completed

- Added `.rbanim` V1 parsing, validation, normalization, and deterministic pretty JSON serialization for project metadata, sparse joint tracks, easing, and markers.
- Added native Tauri Open, Save, Save As, and New controls. Project name edits participate in undo/redo and dirty tracking.
- Added Rust project read/write commands, `.rbanim` extension and JSON schema-version checks, a 5 MB size limit, and same-directory atomic replacement using a temporary file.
- Installed and registered Tauri's native dialog plugin with the default capability.
- Added project load/reset behavior that restores rig, FPS, duration, loop, priority, tracks, markers, and clean history state.
- Closed Phase 8's marker persistence gate with frontend parsing/store reopen coverage and a Rust temporary-file save/reopen roundtrip that preserves `THROW @ 16`.
- Prevented data loss by rejecting saves when the current preview pose contains unkeyed edits that the V1 format cannot represent; saving during playback pauses and evaluates at an integer frame.

## Files created

- `src/core/project/rbanim.ts`
- `src/core/project/rbanim.test.ts`
- `docs/handoffs/PHASE_09.md`

## Files modified

- `src/App.tsx`, `src/App.css`, `src/store/commands.ts`, `src/store/editorStore.ts`, `src/store/editorStore.test.ts`, `src/store/history.ts`
- `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/capabilities/default.json`
- `package.json`, `package-lock.json`
- `AGENT_STATE.md`, `docs/handoffs/PHASE_08.md`

## Tests added/updated

- Schema and save-pose tests cover V1 roundtrip, sorted tracks, invalid JSON, future schema, unknown rig/joint, bad quaternion, duplicate frames, bad FPS, invalid markers, size limit, and rejection/acceptance of preview poses against tracks.
- Store test loads an R6 project with a marker, verifies clean state/path, renames with undo, and starts a new R15 project.
- Rust tests cover JSON/schema rejection and atomic save/reopen, including replacing an existing file while preserving marker content.

## Verification results

- `npm run verify` passed: TypeScript, ESLint, 12 Vitest files / 70 tests, Prettier, Rust formatting, Clippy, Rust tests (3/3), and Vite production build.
- UI smoke confirmed New/Open/Save/Save As and project name controls render. The native dialog itself was not manually operated in this browser-only UI smoke.

## Known limitations

- No migration beyond schema V1 is defined; future schema versions fail with a clear unsupported-version error.
- Vite reports the large JavaScript chunk advisory; Rust's Windows linker emits its localized test warning.

## Suggested next action

Review Phase 9 and the Phase 8 marker roundtrip, mark both gates PASSED, then begin Phase 10 export normalization.
