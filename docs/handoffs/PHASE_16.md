# Phase 16 Handoff — UX polish

## Status
PASSED — editor shortcuts, unsaved-work confirmation, focus visibility, and key tooltips are in place; existing error, loading, and dirty-state feedback was checked.

## Changes

- Added Ctrl/Cmd+N, Ctrl/Cmd+O, and Ctrl/Cmd+S shortcuts. Existing undo/redo and Space playback shortcuts remain available.
- Opening a project with unsaved edits now asks before replacing the current project.
- Added keyboard-visible focus outlines for buttons, inputs, selects, and focusable controls.
- Added tooltips and shortcut hints to file, history, export, rig, and playback controls.
- Kept bridge checking/connected/error status visible; export remains disabled until the bridge is connected.
- Kept save errors in the timeline alert and the modified/saved state in the viewport header.

## Verification

- `npm run typecheck`: PASSED.
- `npm run lint`: PASSED with no warnings.
- `npx prettier --check src\App.tsx src\App.css`: PASSED.
- Manual desktop check: `Ctrl+N` created a new project, `Ctrl+O` opened the saved R6 project, and `Ctrl+S` saved it; the R6 timeline and `THROW` marker remained visible and bridge status was connected.

## Next action

Complete Phase 17: Windows release build, plugin artifact, installation documentation, changelog, and the documented local smoke test.
