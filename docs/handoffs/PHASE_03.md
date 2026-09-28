# Phase 3 Handoff

## Status
READY_FOR_REVIEW

## Scope completed

- Replaced the bootstrap preview screen with a compact editor workspace containing a joint tree, R3F viewport, rig selector, and inspector.
- Rendered the approved R6 and R15 definitions as hierarchical primitive parts using the Phase 2 bind positions, geometry, and canonical joint IDs.
- Added camera orbit, pan, and zoom controls. Left drag remains available to the selected-joint rotation gizmo; right drag orbits, middle drag pans, and the wheel zooms.
- Added click selection from both the rendered parts and joint tree, selected-joint highlight, a local-space rotation gizmo, Escape to clear selection, and F/double-click to focus the selected joint.
- Added inspector rotation fields for all editable joints, root position fields, and Reset Joint.
- Kept edit transforms as plain TypeScript pose offsets and quaternions. Three.js objects are render/control adapters only; they are not stored as project state.
- The pose model is local to the editor component for this phase. Persistent editor store, commands/history, and undo/redo remain in Phase 4.

## Files created

- src/components/viewport/RobloxRig.tsx
- src/components/viewport/Viewport.tsx
- src/core/rigs/pose.ts
- src/core/rigs/pose.test.ts

## Files modified

- src/App.tsx — editor layout, rig switch, joint selection, inspector edits, and reset.
- src/App.css — compact dark desktop workspace styling.
- src/App.test.tsx — component interaction coverage for joint selection, rotation fields, and rig switching.
- .prettierignore — excludes generated glTF model assets from source formatting checks.

## Tests added

- Pose rotation updates are immutable and independent of Three.js.
- Joint local rotation converts to/from canonical bind-relative offsets.
- Root translation is accepted; body translation, unknown joints, non-finite positions, and invalid rotations are rejected.
- App tests select an R15 arm, edit its rotation through the inspector, and switch to the R6 hierarchy.

## Commands executed

- Prettier on App, viewport, pose, test, and CSS files.
- npm run verify with Node.js and Cargo added to PATH.
- npm run tauri dev.
- PowerShell process and local HTTP smoke: confirmed Roblox Animator Desktop window process was responsive and http://localhost:1420/ returned HTTP 200.

## Verification results

- npm run verify: passed after implementation.
- TypeScript typecheck: passed.
- ESLint: passed.
- Vitest: 6 files and 29 tests passed.
- Prettier: passed.
- Rust fmt, Clippy, and tests: passed (1 Rust smoke test).
- Vite production build: passed. Existing advisory remains for the ~1.19 MB uncompressed JavaScript bundle; Rust linker prints its existing localized informational warning.
- Desktop smoke: Tauri dev process launched with the expected window title and reported responsive; Vite returned HTTP 200.
- Independent interactive smoke in the local viewport: switched between R6 and R15, selected both right arms, rotated R15 with the viewport gizmo and R6 through its local rotation inspector, and confirmed the selected geometry and inspector values changed. R6 was returned to zero rotation; the app state is local preview only.

## Known limitations

- Rig geometry and offsets reuse Phase 2 primitive metadata; they remain intentionally approximate and should be visually reviewed against the Studio screenshots/standard rigs.
- R6/R15 switching resets the in-memory preview pose, which is expected before Phase 4 store/history.
- No timeline, keyframes, playback, persistent store, undo, or redo were added.
- The gizmo edits a local rotation and the inspector displays the corresponding local XYZ Euler values.

## Decisions made

- No stack, architecture, .rbanim schema, or Roblox API decision was changed.
- No Three.js object or reference is part of the pose data contract.

## Risks for next phase

- Visually assess the approximate limb/torso proportions and refine if needed while building the viewport out.
- Phase 4 should route edits through its command/store layer while retaining the current pure pose functions and UI behavior.

## Suggested next action

Review this handoff and mark Phase 3 PASSED after independent review.
