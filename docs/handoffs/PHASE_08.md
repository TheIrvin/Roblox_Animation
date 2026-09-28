# Phase 8 Handoff

## Status
IN_PROGRESS — marker data and editing are implemented; the save/reopen acceptance gate depends on Phase 9 persistence.

## Scope completed

- Added validated markers with stable IDs, frame/name/value fields, deterministic frame ordering, and create, rename, move, and delete operations.
- Added an Events lane with current-frame marker creation, selection, drag-to-move, rename, and delete controls.
- Included markers in document snapshots, dirty state, undo/redo, and duration validation.
- Added the ThrowRock `THROW` marker at frame 16 in the store fixture test.

## Files created

- `src/core/animation/markers.ts`
- `src/core/animation/markers.test.ts`
- `docs/handoffs/PHASE_08.md`

## Files modified

- `src/App.tsx`, `src/App.css`
- `src/store/commands.ts`, `src/store/editorStore.ts`, `src/store/editorStore.test.ts`, `src/store/history.ts`
- `AGENT_STATE.md`

## Tests added/updated

- Marker tests cover order, move, delete, rename, optional value, duplicate IDs, invalid name/ID/frame, and duration boundaries.
- Store tests cover `THROW @ 16`, dirty/saved snapshot serialization, duration guard, and marker undo/redo.

## Verification results

- `npm run verify` passed: TypeScript, ESLint, 11 Vitest files / 62 tests, Prettier, Rust formatting, Clippy, Rust tests (1/1), and Vite production build.
- UI smoke confirmed the Events lane and marker editor controls render.

## Known limitations

- The app does not yet save or reopen `.rbanim` files. Phase 9 owns project serialization and file dialogs; Phase 8 remains open until markers survive that roundtrip.
- Vite reports the large JavaScript chunk advisory; Rust's Windows linker emits its localized test warning.

## Suggested next action

Implement Phase 9 project validation, serialization/parser, and native open/save. Then verify marker save/reopen and close the Phase 8 gate.
