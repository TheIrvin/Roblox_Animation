# Phase 10 Handoff

## Status
PASSED

## Scope completed

- Added export validation by reparsing the `.rbanim` V1 project and reporting structured errors instead of producing an invalid payload.
- Added deterministic global frame collection from all track keyframes and markers, with stable ordering and `frame / fps` time conversion.
- Evaluated a complete R6 or R15 pose at every export frame, including joints without authored tracks, and carried the active easing and markers into the normalized envelope.
- Added `ExportEnvelopeV1` with protocol version, export identity/time metadata, normalized project, and complete evaluated frames.
- Added ThrowRock R6 and R15 fixtures with torso/arm tracks and `THROW @ 16`, plus full-envelope snapshots using fixed export metadata.

## Files created

- `src/core/export/normalizer.ts`
- `src/core/export/normalizer.test.ts`
- `src/core/export/fixtures/throw-rock-r6.json`
- `src/core/export/fixtures/throw-rock-r15.json`
- `src/core/export/__snapshots__/normalizer.test.ts.snap`
- `docs/handoffs/PHASE_10.md`

## Files modified

- `AGENT_STATE.md`

## Tests added

- Snapshot and deterministic-repeat coverage for R6 and R15 full-pose envelopes.
- Checks for global frames/times, full rig joint coverage, and `THROW @ 16` preservation.
- Invalid project, export ID, and timestamp diagnostics.

## Commands executed

- `npm run test -- --update`
- `npm run verify`

## Verification results

- `npm run verify` passed: TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, Rust tests (3/3), and Vite production build.
- The Vite large-chunk advisory and localized Windows linker warning remain.

## Known limitations

- Export ID and creation time are intentionally fresh metadata for normal exports; fixture snapshots inject fixed values to verify deterministic payload content.
- A nonlinear sparse-track segment split by another joint's global keyframe is sampled exactly at each global frame. Applying easing to those new intervals can slightly change the in-between trajectory; keyframe optimization/curve reconstruction is outside this phase.

## Decisions made

- Export poses follow rig definition order, frames are ascending, and markers at a shared frame sort by stable marker ID.
- Missing joint tracks export bind-pose identity offsets with Linear/Out easing.

## Risks for next phase

- The bridge must serve this envelope as-is, enforce the documented body-size cap, and bind only to `127.0.0.1`.
- Phase 13 should validate that the selected per-pose easing fields map correctly to Roblox enums.

## Suggested next action

Review Phase 10 normalization and snapshots, mark it PASSED, then implement the local Rust bridge.
