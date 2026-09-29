# Phase 13 Handoff

## Status
IN_PROGRESS — implementation and automated validation are complete; the Studio import gate is pending.

## Scope completed

- Added a bounded ExportEnvelopeV1 validator for R6/R15, including full pose coverage, quaternion/position numbers, easing, sorted frame times, source-track consistency, and marker preservation.
- Added stable R6 and R15 pose trees using the Roblox part names, with sparse desktop tracks already normalized to complete rig poses for each global frame.
- Added quaternion normalization and direct quaternion-to-`CFrame` conversion without Euler angles.
- Added `KeyframeSequence` creation with keyframe times, easing, marker name/value, loop, and animation priority metadata.
- Added non-destructive import into `ServerStorage.RobloxAnimatorImports`; name collisions create a numbered sibling rather than replacing an existing animation.
- Added import ACKs to the local bridge and a **Validate Selected Rig** button that reports missing body parts.
- Installed the official Luau 0.740 Windows CLI into `%LOCALAPPDATA%\Programs\Luau` and added `npm run test:plugin` for repeatable parser/unit validation.

## Files created

- `studio-plugin/src/EnvelopeValidator.lua`
- `studio-plugin/src/KeyframeSequenceBuilder.lua`
- `studio-plugin/src/Quaternion.lua`
- `studio-plugin/src/RigDefinitions.lua`
- `studio-plugin/src/RigValidator.lua`
- `studio-plugin/tests/run.luau`
- `scripts/test-plugin.ps1`
- `docs/handoffs/PHASE_13.md`

## Files modified

- `studio-plugin/src/BridgeClient.lua` — bounded import payload and POST ACK.
- `studio-plugin/src/UI.lua` — build/store KeyframeSequence and validate selected rig.
- `package.json` — added `test:plugin`.
- `AGENT_STATE.md`.

## Tests and build

- `npm run test:plugin` passed: Luau parser accepted all plugin modules and 13 CLI unit tests passed for quaternion identity/axes/combinations, R6/R15 full-pose envelopes, unsupported rig, missing poses, zero quaternion, missing markers, and the 5 MB guard.
- `npm run build:plugin` passed with Rojo 7.7.0; model size is 12,765 bytes and the artifact was copied into `%LOCALAPPDATA%\Roblox\Plugins\RobloxAnimatorPlugin.rbxm`.
- `npm run verify` passed: TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, 7 Rust tests, and Vite production build. Existing large Vite chunk and Windows linker notices remain.
- `rojo sourcemap studio-plugin/default.project.json` confirms the root plugin Script contains all seven ModuleScripts.
- Temporary manual test projects were copied from the existing deterministic fixtures to `%TEMP%\RobloxAnimatorPhase13\ThrowRock-R15.rbanim` and `%TEMP%\RobloxAnimatorPhase13\ThrowRock-R6.rbanim`.

## Manual validation pending

The Phase 12 screenshot at `docs/handoffs/evidence/phase-12-connected.png` confirms the plugin can reach the local bridge. Phase 13's required Studio gate is not yet passed: Studio must restart to load the new builder, the R15 fixture must be opened and exported from the desktop app, and **Import Latest** must create `ServerStorage.RobloxAnimatorImports/ThrowRock` (or a numbered sibling if the name exists). Inspect the full R15 pose tree, all four fixture times (0, 9, 16, 22 at 30 FPS), `THROW` marker with value `rock`, `Loop = false`, and `Priority = Action`; confirm the desktop ACK.

## Decisions and references

- Quaternion components use Roblox's documented `CFrame.new(x, y, z, qX, qY, qZ, qW)` constructor; export does not round-trip through Euler angles.
- R6 tree: `HumanoidRootPart -> Torso -> Head/arms/legs`. R15 tree follows the standard root/lower torso/upper torso/limb hierarchy.
- Imports preserve existing sequences by selecting the next available numbered name.
- `KeyframeSequence` loop/priority, `Pose` CFrame/easing, `KeyframeMarker.Value`, and plugin `Selection:Get()` are based on Roblox Creator Hub API references: [KeyframeSequence](https://create.roblox.com/docs/reference/engine/classes/KeyframeSequence), [Pose](https://create.roblox.com/docs/reference/engine/classes/Pose), [PoseEasingStyle](https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle), [KeyframeMarker](https://create.roblox.com/docs/reference/engine/classes/KeyframeMarker), [CFrame](https://create.roblox.com/docs/reference/engine/datatypes/CFrame), and [Selection](https://create.roblox.com/docs/reference/engine/classes/Selection/Get).

## Next action

Restart Roblox Studio, open `%TEMP%\RobloxAnimatorPhase13\ThrowRock-R15.rbanim` in the desktop app, click **Prepare Export**, then click **Import Latest** in Studio and inspect the created sequence. Record the Studio evidence before marking Phase 13 PASSED.
