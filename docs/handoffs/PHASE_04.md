# Phase 4 Handoff

## Status
READY_FOR_REVIEW

## Scope completed

- Added a Zustand editor store with the active rig, local joint pose, selection, current frame, dirty state, and undo/redo availability.
- Added semantic commands for joint rotation/position, joint reset, pose reset, and rig changes.
- Added immutable history snapshots and viewport transform transactions so a continuous gizmo drag creates one undo entry.
- Connected the inspector, rig selector, viewport gizmo, keyboard shortcuts, and history buttons to the store.
- Added the user's Roblox exports to the viewport: the humanoid R6 Malla model and the square R15 model. R6's exported parts are reparented to canonical pivot groups while preserving their world transforms; R15 uses its native joint hierarchy.
- Normalized exported Studio world coordinates and aligned the ground grid and root inspector to the Roblox root at Y=2.

## Files created

- `src/store/commands.ts`
- `src/store/editorStore.ts`
- `src/store/history.ts`
- `src/store/editorStore.test.ts`
- `src/components/viewport/ImportedRobloxRig.tsx`
- `public/models/roblox-r6.gltf`
- `public/models/roblox-r15.gltf`

## Files modified

- `src/App.tsx`, `src/App.css`, `src/App.test.tsx`
- `src/components/viewport/Viewport.tsx`
- `src/core/rigs/r6.ts`, `src/core/rigs/r15.ts`
- `docs/DECISIONS.md`, `docs/handoffs/PHASE_03.md`

## Verification

- Full `npm run verify` passed after the store and model integration: 7 test files / 35 tests, Rust tests 1/1, typecheck, ESLint, Prettier, Clippy, and Vite build.
- Manual viewport smoke after the imported mesh change: R15 square export and R6 humanoid export load; selecting and rotating the R6 right arm updates the imported mesh; Reset Joint returns it to the bind pose. Toolbar Undo/Redo was exercised across the inspector edits and reset; the pose returned to neutral.

## Known limitations

- Roblox's GLTF exporter emits repeated warnings about missing POSITION accessor min/max metadata; Three.js still loads and renders both supplied models. Vite reports its existing >500 kB JavaScript chunk advisory.
- Studio screenshots/models are only used as viewport meshes. The animation data remains canonical joint transforms, not Three.js objects.
- The unused `Rig_R6.gltf` file supplied by the user is left untouched in the workspace.

## Suggested next action

Independently review Phase 4, run `npm run verify`, update `AGENT_STATE.md`, and begin Phase 5 only after Phase 4 is approved.
