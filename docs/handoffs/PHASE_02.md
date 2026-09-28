# Phase 2 Handoff

## Phase
2 — Rig definitions R6/R15

## Status
PASSED

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
- Studio runtime evidence: `RobloxStudioBeta.exe` was installed and running. Studio-generated rig screenshots were supplied by the user and are recorded below.
- Local R6 XML evidence: the installed path is `content/models/Thumbnails/Mannequins/R6.rbxmx`. It contains `Head`, `Torso`, `Left Arm`, `Right Arm`, `Left Leg`, and `Right Leg`, but no `HumanoidRootPart`; the body parts are children of the `MrGrey` model, while Motor6D instances are children of `Torso`. This is a thumbnail mannequin, not a standard Rig Builder rig, so it was not treated as satisfying the Studio comparison requirement. The installed R15 asset is binary `.rbxm` and was not decoded.
- Manual Studio comparison: user-provided Explorer screenshots from Studio show a generated R15 rig with `HumanoidRootPart`, `LowerTorso`, `UpperTorso`, `Head`, and all left/right upper/lower limb, hand, and foot parts; the R6 screenshot shows `HumanoidRootPart`, `Torso`, `Head`, both arms, and both legs. These match the canonical part IDs in the phase definitions. The images are preserved at `docs/handoffs/evidence/phase-02-r15-explorer.png` and `docs/handoffs/evidence/phase-02-r6-explorer.png`.
- In both screenshots, body-part instances appear as children of the top-level `Rig` model. The internal `parentId` values represent the animation joint graph, not Roblox `Instance.Parent`. Roblox's Pose documentation confirms that pose hierarchy follows the connected joint graph; the Humanoid reference requires R6 `Head` to attach to `Torso` and R15 `Head` to `UpperTorso`. R6/R15 standard joint-name sets are also listed by `HumanoidRigDescription` (sources linked below).
- Roblox documentation checked: [Rig Generator](https://create.roblox.com/docs/studio/rig-builder), [Pose hierarchy](https://create.roblox.com/docs/reference/engine/classes/Pose), [Humanoid rig requirements](https://create.roblox.com/docs/reference/engine/classes/Humanoid), and [HumanoidRigDescription joint names](https://create.roblox.com/docs/reference/engine/classes/HumanoidRigDescription).

## Known limitations
- Bind dimensions and offsets are deterministic primitive-preview metadata. The phase specification permits project-owned primitive geometry; visual fit should be refined during Phase 3 viewport review.
- Explorer screenshots confirm the part IDs but do not expose every joint's Part0/Part1 property. Internal joint parent links follow the documented standard R6/R15 pose chains and remain covered by hierarchy validation; export compatibility will receive its own Studio checks in later phases.

## Decisions made
- No stack, architecture, project schema, or API decision was changed.
- `parentId` represents the connected animation-joint hierarchy, not the direct `Instance.Parent` shown for body parts in Explorer. The official Roblox Pose and Humanoid references support this distinction and the head-parent links for R6/R15.
- The Studio name comparison is recorded in `docs/DECISIONS.md`; no discrepancy from the canonical R6/R15 part sets was found.

## Risks for next phase
- Viewport dimensions and bind offsets use approximate project-owned primitives and should be reviewed visually in Phase 3.
- Explorer screenshots confirm part names but do not expose every joint's `Part0`/`Part1`; exact Studio export mapping remains part of the later integration checks.

## Suggested next action
Begin Phase 3: render the approved internal rigs in the viewport and review their primitive dimensions and offsets.
