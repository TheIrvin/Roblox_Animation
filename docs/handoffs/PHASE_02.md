# Phase 2 Handoff

## Phase
2 — Rig definitions R6/R15

## Status
READY_FOR_REVIEW

## Scope completed
- Added stable `R6` and `R15` rig definitions with canonical Roblox part IDs and parent links matching the hierarchy in `docs/06_RIG_SPECIFICATION.md`.
- Added bind positions/identity rotations, editable transform flags, symmetric mirror IDs, and primitive box dimensions/offsets for all parts.
- Added a validator for unique IDs, a single declared root, existing parents, cycles, root connectivity, symmetric mirror mappings, finite bind positions, unit bind quaternions, and valid primitive geometry.
- Added tests for canonical part IDs, hierarchy validity, unique IDs, mirror symmetry, bind quaternion validity, geometry metadata, and malformed cycles/parents/mirrors/transforms.
- No UI, viewport, store, or later-phase features were added.

## Files created
- `src/core/rigs/types.ts`
- `src/core/rigs/r6.ts`
- `src/core/rigs/r15.ts`
- `src/core/rigs/validate.ts`
- `src/core/rigs/rigs.test.ts`

## Files modified
- `AGENT_STATE.md` — Phase 2 is `READY_FOR_REVIEW`; the Studio comparison is recorded as a blocker to the phase gate.
- `docs/DECISIONS.md` — added a factual note about the installed R6 mannequin thumbnail and why it does not count as generated-Rig-Builder evidence.

## Tests added
- Validity and parent references for R6/R15; exactly one root and unique IDs.
- Exact canonical R6/R15 part ID sets.
- Symmetric left/right mirror mappings and self-mapping center joints.
- Unit bind quaternions, finite positions, and positive box dimensions.
- Validator rejection of cycles, missing parents, disconnected joints, asymmetric mirrors, non-unit quaternions, and invalid geometry.

## Commands executed
- `npx prettier --write src/core/rigs/rigs.test.ts src/core/rigs/validate.ts`
- `$env:PATH = 'C:\Program Files\nodejs;C:\Users\irvin\.cargo\bin;' + $env:PATH; npm run verify`
- PowerShell inspection of the running Roblox Studio process and the installed `content/models/Thumbnails/Mannequins/R6.rbxmx` XML.

## Verification results
- `npm run verify`: passed.
- Typecheck and ESLint: passed.
- Vitest: 5 test files, 25 tests passed.
- Prettier: passed.
- Cargo fmt, Clippy, and Rust tests: passed (1 Rust smoke test).
- Frontend production build: passed. Existing advisory remains for the ~1.15 MB uncompressed JS chunk; Rust linker emitted its existing informational warning.
- Studio runtime evidence: `RobloxStudioBeta.exe` was installed and running with `Responding=True`, window title `Roblox Studio`. The CUA API in this task returned no apps and does not provide `listWindows` or `listApps`, so the Studio window could not be inspected or operated.
- Local R6 XML evidence: the installed path is `content/models/Thumbnails/Mannequins/R6.rbxmx`. It contains `Head`, `Torso`, `Left Arm`, `Right Arm`, `Left Leg`, and `Right Leg`, but no `HumanoidRootPart`; the body parts are children of the `MrGrey` model, while Motor6D instances are children of `Torso`. This is a thumbnail mannequin, not a standard Rig Builder rig, so it was not treated as satisfying the Studio comparison requirement. The installed R15 asset is binary `.rbxm` and was not decoded.

## Known limitations
- Bind dimensions and offsets are deterministic primitive-preview metadata, not measured/validated against generated Studio rigs.
- The mandatory standard R6 and R15 Block generation and hierarchy/name comparison in Studio remains outstanding. Do not mark Phase 2 `PASSED` until it is performed and discrepancies, if any, are recorded.

## Decisions made
- No stack, architecture, project schema, or API decision was changed.
- A validation note was added to `docs/DECISIONS.md` for the limited local thumbnail evidence; no discrepancy from a generated standard rig is claimed.

## Risks for next phase
- Viewport dimensions and bind offsets should be reviewed after the standard Studio rig comparison; generated geometry may require adjustments.
- The part-parent tree in an installed thumbnail is not proof of the KeyframeSequence pose/joint hierarchy.

## Suggested next action
Review the definitions and validator; use Roblox Studio Rig Builder to generate R6 and R15 Block, compare the part names and hierarchy with `docs/06_RIG_SPECIFICATION.md`, and record any actual standard-rig deviations before marking this phase `PASSED`.
