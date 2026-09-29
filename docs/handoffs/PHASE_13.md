# Phase 13 Handoff

## Status
PASSED — implementation, automated validation, and Studio import/playback checks are complete for R15 and R6.

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

## Studio verification completed

- The Studio plugin connected to the desktop bridge and imported the R15 and R6 fixtures into `ServerStorage.RobloxAnimatorImports` as `ThrowRock` and `ThrowRock (2)` without replacing an existing sequence.
- Both sequences contain keyframes at 0, 0.300, 0.533, and 0.733 seconds, with a `THROW` marker carrying value `rock` at 0.533 seconds; `Loop = false` and `Priority = Action`.
- Studio's `KeyframeSequenceProvider:RegisterKeyframeSequence` generated temporary preview IDs. In Play mode, the matching R15 and R6 rigs both moved during playback, reached a 0.733-second track length, and fired `THROW` with value `rock`.
- The temporary R15 test rig was created only in the Play DataModel and disappeared when Play mode stopped; no test rig was saved into the place.
- The final local R15/R6 sequences remain under `ServerStorage.RobloxAnimatorImports`.

This validates local import and engine playback. Publishing an asset and testing the published asset IDs belongs to Phases 14 and 15.

## Decisions and references

- Quaternion components use Roblox's documented `CFrame.new(x, y, z, qX, qY, qZ, qW)` constructor; export does not round-trip through Euler angles.
- R6 tree: `HumanoidRootPart -> Torso -> Head/arms/legs`. R15 tree follows the standard root/lower torso/upper torso/limb hierarchy.
- Imports preserve existing sequences by selecting the next available numbered name.
- `KeyframeSequence` loop/priority, `Pose` CFrame/easing, `KeyframeMarker.Value`, and plugin `Selection:Get()` are based on Roblox Creator Hub API references: [KeyframeSequence](https://create.roblox.com/docs/reference/engine/classes/KeyframeSequence), [Pose](https://create.roblox.com/docs/reference/engine/classes/Pose), [PoseEasingStyle](https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle), [KeyframeMarker](https://create.roblox.com/docs/reference/engine/classes/KeyframeMarker), [CFrame](https://create.roblox.com/docs/reference/engine/datatypes/CFrame), and [Selection](https://create.roblox.com/docs/reference/engine/classes/Selection/Get).

## Next action

Continue the R15 E2E: publish `ThrowRock` from the native Animation Editor, record its asset ID, and verify playback and the marker using that ID.
